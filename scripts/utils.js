export const validateInputs = (...inputs) =>
  inputs.every(input => Number.isFinite(input));

export const allPositive = (...inputs) => inputs.every(input => input > 0);
