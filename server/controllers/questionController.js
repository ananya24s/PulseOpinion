const fs = require("fs/promises");
const {analyzeAttachment: analyzeAttachmentWithAI,} = require("../services/attachmentAnalysisService");
const questionModel = require('../models/questionModel');
const {analyzeDiscussion,} = require("../services/verificationService");
const {
  splitQuestions,
} = require("../services/questionSplitter");
async function removeUploadedFile(file) {
  if (!file?.path) {
    return;
  }

  try {
    await fs.unlink(file.path);
  } catch (error) {
    console.error(
      "Failed to clean up uploaded file:",
      error
    );
  }
}
async function getQuestions(req, res) {
  try {
    const questions = await questionModel.getAllQuestions(req.user?.id);
    res.status(200).json({ success: true, data: questions });
  } catch(err){
   console.error(err);
   res.status(500).json({success: false,message: "Failed to fetch questions." });
  }
}

async function createQuestion(req, res) {
  try {
   const {text,category, aiContext,} = req.body;
    const trimmedText = text?.trim();

    if (!trimmedText) {
      await removeUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        message: "Question text is required.",
      });
    }

    if (trimmedText.length < 10) {
      await removeUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        message:
          "Question text must be at least 10 characters.",
      });
    }

    if (trimmedText.length > 250) {
      await removeUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        message:
          "Question text must be 250 characters or fewer.",
      });
    }

    const attachment = req.file
      ? {
          originalName: req.file.originalname,
          storedName: req.file.filename,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          filePath: `uploads/questions/${req.file.filename}`,
        }
      : null;

    const question =
     await questionModel.createQuestion({
     text: trimmedText,
     category,
     userId: req.user.id,
     aiContext: aiContext?.trim() || null,
     attachment,
    });

    return res.status(201).json({
      success: true,
      data: question,
    });
  } catch (err) {
    await removeUploadedFile(req.file);

    console.error("Create question error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to create question.",
    });
  }
}

async function likeQuestion(req, res) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid question ID.' });
    }

    const question = await questionModel.likeQuestion(id, req.user.id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    res.status(200).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to like question.' });
  }
}

async function dislikeQuestion(req, res) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid question ID.' });
    }

    const question = await questionModel.dislikeQuestion(id, req.user.id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    res.status(200).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to dislike question.' });
  }
}
async function setOpinion(req, res) {
  try {
    const id = Number(req.params.id);
    const { opinion } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID.",
      });
    }

    if (
      !["agree", "disagree", "unsure"].includes(
        opinion
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Opinion must be agree, disagree, or unsure.",
      });
    }

    const result =
      await questionModel.handleOpinionVote(
        id,
        req.user.id,
        opinion
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Set opinion error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update opinion.",
    });
  }
}

async function addComment(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID.",
      });
    }

    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required.",
      });
    }

    const question = await questionModel.addComment(id, {
      text: text.trim(),
      userId: req.user.id,
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    try {
      const discussion =
        await questionModel.getDiscussionForVerification(id);

      if (discussion) {
        const assessment = await analyzeDiscussion({
          question: discussion.text,
          aiContext: discussion.aiContext,
          comments: discussion.comments ?? [],
        });

        await questionModel.upsertVerification(
          id,
          assessment
        );
      }
    } catch (verificationError) {
      console.error(
        "Automatic verification refresh failed:",
        verificationError
      );
    }

    const updatedQuestion =
      await questionModel.getQuestionById(id);

    return res.status(201).json({
      success: true,
      data: updatedQuestion,
    });
  } catch (err) {
    console.error("Add comment error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to add comment.",
    });
  }
}

async function deleteQuestion(req, res) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID.',
      });
    }

    const result = await questionModel.deleteQuestion(
      id,
      req.user.id
    );

    if (result === 'not_found') {
      return res.status(404).json({
        success: false,
        message: 'Question not found.',
      });
    }

    if (result === 'forbidden') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own questions.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully.',
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete question.',
    });
  }
}
async function analyzeAttachment(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Attachment is required.",
    });
  }

  try {
    const extractedText =
      await analyzeAttachmentWithAI(req.file);

    await removeUploadedFile(req.file);
const questions = extractedText
  .split("\n")
  .map(q => q.trim())
  .filter(q => q.length > 10);

return res.status(200).json({
  success: true,
  data: {
    extractedText,
    questions
  }
});

  } catch (error) {
    await removeUploadedFile(req.file);

    console.error(
      "Attachment analysis error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Could not analyze attachment.",
    });
  }
}
async function createQuestionsFromAttachment(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Attachment required",
    });
  }
try {
  const extractedText =
    await analyzeAttachmentWithAI(req.file);

  const questions =
    splitQuestions(extractedText);

  if (questions.length === 0) {
    await removeUploadedFile(req.file);

    return res.status(400).json({
      success: false,
      message: "No questions detected.",
    });
  }

  const created = [];

  for (const questionText of questions) {
    const question =
      await questionModel.createQuestion({
        text: questionText,
        category:
          req.body.category || "General",
        userId: req.user.id,
      });

    created.push(question);
  }

  await removeUploadedFile(req.file);

  return res.status(201).json({
    success: true,
    created: created.length,
    data: created,
  });

} catch (err) {
  await removeUploadedFile(req.file);

  console.error(err);

  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message:
        "AI quota exceeded. Please try again later.",
    });
  }

  return res.status(500).json({
    success: false,
    message:
      "Failed to create questions.",
  });
}
}
async function verifyQuestion(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID.",
      });
    }

    const discussion =
      await questionModel.getDiscussionForVerification(
        id
      );

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    const assessment = await analyzeDiscussion({
      question: discussion.text,
      aiContext: discussion.aiContext,
      comments: discussion.comments ?? [],
    });

    const verification =
      await questionModel.upsertVerification(
        id,
        assessment
      );

    return res.status(200).json({
      success: true,
      data: verification,
    });
  } catch (err) {
    console.error(
      "Verify question error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to verify question.",
    });
  }
}
async function importQuestions(req,res){
  const {questions,category}=req.body;

const created=[];

for(const q of questions){

const question=
await questionModel.createQuestion({
text:q,
category,
userId:req.user.id,
aiContext:null,
attachment:null
});

created.push(question);

}

return res.json({
success:true,
data:created
});
}
module.exports = {
  getQuestions,
  createQuestion,
  importQuestions,
  analyzeAttachment,
  likeQuestion,
  dislikeQuestion,
  setOpinion,
  addComment,
  deleteQuestion,
  verifyQuestion,
  createQuestionsFromAttachment,
};

// const fs = require("fs/promises");
// const {analyzeAttachment: analyzeAttachmentWithAI,} = require("../services/attachmentAnalysisService");
// const questionModel = require('../models/questionModel');
// const {analyzeDiscussion,} = require("../services/verificationService");
// const {
//   splitQuestions,
// } = require("../services/questionSplitter");
// async function removeUploadedFile(file) {
//   if (!file?.path) {
//     return;
//   }

//   try {
//     await fs.unlink(file.path);
//   } catch (error) {
//     console.error(
//       "Failed to clean up uploaded file:",
//       error
//     );
//   }
// }
// async function getQuestions(req, res) {
//   try {
//     const questions = await questionModel.getAllQuestions(req.user?.id);
//     res.status(200).json({ success: true, data: questions });
//   } catch(err){
//    console.error(err);
//    res.status(500).json({success: false,message: "Failed to fetch questions." });
//   }
// }

// async function createQuestion(req, res) {
//   try {
//    const {text,category, aiContext,} = req.body;
//     const trimmedText = text?.trim();

//     if (!trimmedText) {
//       await removeUploadedFile(req.file);

//       return res.status(400).json({
//         success: false,
//         message: "Question text is required.",
//       });
//     }

//     if (trimmedText.length < 10) {
//       await removeUploadedFile(req.file);

//       return res.status(400).json({
//         success: false,
//         message:
//           "Question text must be at least 10 characters.",
//       });
//     }

//     if (trimmedText.length > 250) {
//       await removeUploadedFile(req.file);

//       return res.status(400).json({
//         success: false,
//         message:
//           "Question text must be 250 characters or fewer.",
//       });
//     }

//     const attachment = req.file
//       ? {
//           originalName: req.file.originalname,
//           storedName: req.file.filename,
//           mimeType: req.file.mimetype,
//           fileSize: req.file.size,
//           filePath: `uploads/questions/${req.file.filename}`,
//         }
//       : null;

//     const question =
//      await questionModel.createQuestion({
//      text: trimmedText,
//      category,
//      userId: req.user.id,
//      aiContext: aiContext?.trim() || null,
//      attachment,
//     });

//     return res.status(201).json({
//       success: true,
//       data: question,
//     });
//   } catch (err) {
//     await removeUploadedFile(req.file);

//     console.error("Create question error:", err);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create question.",
//     });
//   }
// }

// async function likeQuestion(req, res) {
//   try {
//     const id = Number(req.params.id);

//     if (isNaN(id)) {
//       return res.status(400).json({ success: false, message: 'Invalid question ID.' });
//     }

//     const question = await questionModel.likeQuestion(id, req.user.id);

//     if (!question) {
//       return res.status(404).json({ success: false, message: 'Question not found.' });
//     }

//     res.status(200).json({ success: true, data: question });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to like question.' });
//   }
// }

// async function dislikeQuestion(req, res) {
//   try {
//     const id = Number(req.params.id);

//     if (isNaN(id)) {
//       return res.status(400).json({ success: false, message: 'Invalid question ID.' });
//     }

//     const question = await questionModel.dislikeQuestion(id, req.user.id);

//     if (!question) {
//       return res.status(404).json({ success: false, message: 'Question not found.' });
//     }

//     res.status(200).json({ success: true, data: question });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to dislike question.' });
//   }
// }
// async function addComment(req, res) {
//   try {
//     const id = Number(req.params.id);

//     if (!Number.isInteger(id) || id <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid question ID.",
//       });
//     }

//     const { text } = req.body;

//     if (!text || !text.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Comment text is required.",
//       });
//     }

//     const question = await questionModel.addComment(id, {
//       text: text.trim(),
//       userId: req.user.id,
//     });

//     if (!question) {
//       return res.status(404).json({
//         success: false,
//         message: "Question not found.",
//       });
//     }

//     try {
//       const discussion =
//         await questionModel.getDiscussionForVerification(id);

//       if (discussion) {
//         const assessment = await analyzeDiscussion({
//           question: discussion.text,
//           aiContext: discussion.aiContext,
//           comments: discussion.comments ?? [],
//         });

//         await questionModel.upsertVerification(
//           id,
//           assessment
//         );
//       }
//     } catch (verificationError) {
//       console.error(
//         "Automatic verification refresh failed:",
//         verificationError
//       );
//     }

//     const updatedQuestion =
//       await questionModel.getQuestionById(id);

//     return res.status(201).json({
//       success: true,
//       data: updatedQuestion,
//     });
//   } catch (err) {
//     console.error("Add comment error:", err);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to add comment.",
//     });
//   }
// }

// async function deleteQuestion(req, res) {
//   try {
//     const id = Number(req.params.id);

//     if (isNaN(id)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid question ID.',
//       });
//     }

//     const result = await questionModel.deleteQuestion(
//       id,
//       req.user.id
//     );

//     if (result === 'not_found') {
//       return res.status(404).json({
//         success: false,
//         message: 'Question not found.',
//       });
//     }

//     if (result === 'forbidden') {
//       return res.status(403).json({
//         success: false,
//         message: 'You can only delete your own questions.',
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Question deleted successfully.',
//     });
//   } catch (err) {
//     console.error(err);

//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete question.',
//     });
//   }
// }
// async function analyzeAttachment(req, res) {
//   if (!req.file) {
//     return res.status(400).json({
//       success: false,
//       message: "Attachment is required.",
//     });
//   }

//   try {
//     const extractedText =
//       await analyzeAttachmentWithAI(req.file);

//     await removeUploadedFile(req.file);
// const questions = extractedText
//   .split("\n")
//   .map(q => q.trim())
//   .filter(q => q.length > 10);

// return res.status(200).json({
//   success: true,
//   data: {
//     extractedText,
//     questions
//   }
// });

//   } catch (error) {
//     await removeUploadedFile(req.file);

//     console.error(
//       "Attachment analysis error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Could not analyze attachment.",
//     });
//   }
// }
// async function createQuestionsFromAttachment(req, res) {
//   if (!req.file) {
//     return res.status(400).json({
//       success: false,
//       message: "Attachment required",
//     });
//   }
// try {
//   const extractedText =
//     await analyzeAttachmentWithAI(req.file);

//   const questions =
//     splitQuestions(extractedText);

//   if (questions.length === 0) {
//     await removeUploadedFile(req.file);

//     return res.status(400).json({
//       success: false,
//       message: "No questions detected.",
//     });
//   }

//   const created = [];

//   for (const questionText of questions) {
//     const question =
//       await questionModel.createQuestion({
//         text: questionText,
//         category:
//           req.body.category || "General",
//         userId: req.user.id,
//       });

//     created.push(question);
//   }

//   await removeUploadedFile(req.file);

//   return res.status(201).json({
//     success: true,
//     created: created.length,
//     data: created,
//   });

// } catch (err) {
//   await removeUploadedFile(req.file);

//   console.error(err);

//   if (err.status === 429) {
//     return res.status(429).json({
//       success: false,
//       message:
//         "AI quota exceeded. Please try again later.",
//     });
//   }

//   return res.status(500).json({
//     success: false,
//     message:
//       "Failed to create questions.",
//   });
// }
// }
// async function verifyQuestion(req, res) {
//   try {
//     const id = Number(req.params.id);

//     if (!Number.isInteger(id) || id <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid question ID.",
//       });
//     }

//     const discussion =
//       await questionModel.getDiscussionForVerification(
//         id
//       );

//     if (!discussion) {
//       return res.status(404).json({
//         success: false,
//         message: "Question not found.",
//       });
//     }

//     const assessment = await analyzeDiscussion({
//       question: discussion.text,
//       aiContext: discussion.aiContext,
//       comments: discussion.comments ?? [],
//     });

//     const verification =
//       await questionModel.upsertVerification(
//         id,
//         assessment
//       );

//     return res.status(200).json({
//       success: true,
//       data: verification,
//     });
//   } catch (err) {
//     console.error(
//       "Verify question error:",
//       err
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Failed to verify question.",
//     });
//   }
// }
// async function importQuestions(req,res){
//   const {questions,category}=req.body;

// const created=[];

// for(const q of questions){

// const question=
// await questionModel.createQuestion({
// text:q,
// category,
// userId:req.user.id,
// aiContext:null,
// attachment:null
// });

// created.push(question);

// }

// return res.json({
// success:true,
// data:created
// });
// }
// module.exports = {
//   getQuestions,
//   createQuestion,
//   importQuestions,
//   analyzeAttachment,
//   likeQuestion,
//   dislikeQuestion,
//   addComment,
//   deleteQuestion,
//   verifyQuestion,
//   createQuestionsFromAttachment,
// };