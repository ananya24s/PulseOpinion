function splitQuestions(text) {
  if (!text) return [];

  const matches =
    text.match(
      /(Q\s*\d+\.?|Question\s*\d+\.?|\d+\.)[\s\S]*?(?=(Q\s*\d+\.?|Question\s*\d+\.?|\d+\.)|$)/gi
    ) || [];

  return matches
    .map((q) =>
      q.replace(/\n{2,}/g, "\n").trim()
    )
    .filter((q) => q.length > 8);
}

module.exports = {
  splitQuestions,
};