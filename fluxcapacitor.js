/**
 * Forecast future values from a sequence of numeric observations.
 * This is a simple linear-trend estimate, not a guarantee of what will happen.
 *
 * @param {number[]} history Observations in chronological order.
 * @param {number} horizon Number of future steps to forecast.
 * @returns {{forecasts: Array<{step: number, value: number, lower: number, upper: number}>, slope: number, intercept: number}}
 */
function predictFuture(history, horizon) {
	if (!Array.isArray(history) || history.length < 2) {
		throw new TypeError('history must contain at least two numbers');
	}
	if (!history.every(Number.isFinite)) {
		throw new TypeError('history must contain only finite numbers');
	}
	if (!Number.isInteger(horizon) || horizon < 1) {
		throw new RangeError('horizon must be a positive integer');
	}

	const count = history.length;
	const meanX = (count - 1) / 2;
	const meanY = history.reduce((sum, value) => sum + value, 0) / count;
	let numerator = 0;
	let denominator = 0;

	for (let index = 0; index < count; index += 1) {
		numerator += (index - meanX) * (history[index] - meanY);
		denominator += (index - meanX) ** 2;
	}

	const slope = numerator / denominator;
	const intercept = meanY - slope * meanX;
	const residuals = history.map((value, index) => value - (intercept + slope * index));
	const residualStdDev = Math.sqrt(
		residuals.reduce((sum, residual) => sum + residual ** 2, 0) / Math.max(1, count - 2),
	);

	const forecasts = Array.from({ length: horizon }, (_, index) => {
		const step = count + index;
		const value = intercept + slope * step;
		// A rough 95% range that widens with distance from the observed data.
		const uncertainty = 1.96 * residualStdDev * Math.sqrt(1 + 1 / count + (step - meanX) ** 2 / denominator);
		return { step, value, lower: value - uncertainty, upper: value + uncertainty };
	});

	return { forecasts, slope, intercept };
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = { predictFuture };
}

// Example: node fluxcapacitor.js
if (typeof require !== 'undefined' && require.main === module) {
	const result = predictFuture([10, 12, 13, 15, 16], 3);
	console.log(JSON.stringify(result, null, 2));
}
