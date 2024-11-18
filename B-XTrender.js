//Ported by Colin Weber from Tradingview: B-Xtrender @Puppytherapy v3
//All credit to original author https://www.tradingview.com/script/YHZimEz8-B-Xtrender-Puppytherapy/ 
//and https://ifta.org/public/files/journal/d_ifta_journal_19.pdf IFTA Journal by Bharat Jhunjhunwala
//
describe_indicator('B-XTrender','lower');

// Inputs
const short_l1 = input.number('Short - L1', 2);
const short_l2 = input.number('Short - L2', 20);
const short_l3 = input.number('Short - L3', 2);
const showHistogram = input.boolean("Show Osc. - Histogram", true)
const showColorLine = input.boolean("Show Color - Line", true)

const showTrendLine = input.boolean("Show Trend - Line", true)
const long_l1 = input.number('Long - L1', 20);
const long_l2 = input.number('Long - L2', 2);
let shortTermXtrender = sub(rsi(sub(ema(close, short_l1), ema(close, short_l2)), short_l3),50);

let shortXtrenderCol = [];
shortXtrenderCol.push(null);
for (let i = 1; i < shortTermXtrender.length; i++) {
	if (shortTermXtrender[i] > 0) {
		if (shortTermXtrender[i] > shortTermXtrender[i-1])
			shortXtrenderCol.push(`rgba(0, 230, 118, 0.5)`); // bright green 50% opaque
		else
			shortXtrenderCol.push(`rgba(34, 138, 34, 0.5)`); //dark green 50% opaque
	} else
	{
		if (shortTermXtrender[i] > shortTermXtrender[i-1])
			shortXtrenderCol.push(`rgba(255, 82, 82, 0.5)`); //bright red
		else
			shortXtrenderCol.push(`rgba(139, 00, 00, 0.5)`); //dark red
	}
}

if(showHistogram)
	paint(shortTermXtrender, {
		name: "B-Xtrender Osc. - Histogram",
		color: shortXtrenderCol,
		style: 'column',
		thickness: 1
	});

let longTermXtrender  = sub(rsi(ema(close, long_l1), long_l2 ),50);
let macollongXtrenderCol = [];
macollongXtrenderCol.push(null);
for (let i = 2; i < longTermXtrender.length; i++) {
	if (longTermXtrender[i] > longTermXtrender[i-1])
		macollongXtrenderCol.push(`rgba(0, 230, 118, 0.2)`); // bright green 20% opaque
	else
		macollongXtrenderCol.push(`rgba(255, 82, 82, 0.2)`); //bright red 20% opaque
}
macollongXtrenderCol.push(null);
	
if(showTrendLine)
	paint(longTermXtrender, {
		name: "B-Xtrender Trend - Line",
		color: macollongXtrenderCol,
		style: 'line',
		thickness: 3
	});

function t3(src, len) {
  let xe1_1 = ema(src, len);
  let xe2_1 = ema(xe1_1, len);
  let xe3_1 = ema(xe2_1, len);
  let xe4_1 = ema(xe3_1, len);
  let xe5_1 = ema(xe4_1, len);
  let xe6_1 = ema(xe5_1, len);
  const b_1 = 0.7;
  const c1_1 = -b_1 * b_1 * b_1;
  const c2_1 = 3 * b_1 * b_1 + 3 * b_1 * b_1 * b_1;
  const c3_1 = -6 * b_1 * b_1 - 3 * b_1 - 3 * b_1 * b_1 * b_1;
  const c4_1 = 1 + 3 * b_1 + b_1 * b_1 * b_1 + 3 * b_1 * b_1;
  let nT3Average_1 = [];
  for (let i = 0; i < src.length; i++) {
    nT3Average_1[i] = c1_1 * (xe6_1[i] || 0) + c2_1 * (xe5_1[i] || 0) + c3_1 * (xe4_1[i] || 0) + c4_1 * (xe3_1[i] || 0);
  }
    return nT3Average_1;
}


let maShortTermXtrender = t3( shortTermXtrender , 5 )
let colShortTermXtrender = [];
colShortTermXtrender.push(null);
for (let i = 2; i < maShortTermXtrender.length; i++) {
	if (maShortTermXtrender[i] > maShortTermXtrender[i-1])
		colShortTermXtrender.push(`rgba(0, 230, 118, 0.2)`); // bright green 20% opaque
	else
		colShortTermXtrender.push(`rgba(255, 82, 82, 0.2)`); //bright red 20% opaque
}
colShortTermXtrender.push(null);

if(showColorLine)
	paint(maShortTermXtrender, {
		name: "B-Xtrender Color - Line",
		color: colShortTermXtrender,
		style: 'line',
		thickness: 3
	});

let bullSwitch = Array(maShortTermXtrender.length).fill(null);
let bearSwitch = Array(maShortTermXtrender.length).fill(null);
// Start from index 2 since we need to look back 2 positions
for (let i = 2; i < maShortTermXtrender.length; i++) {
	const cur = maShortTermXtrender[i];
	const prev = maShortTermXtrender[i-1];
	const twoBefore = maShortTermXtrender[i-2];
	
	if (cur > prev && prev < twoBefore) {
		bullSwitch[i] = cur;
	} else {
		bullSwitch[i] = null;
	}
	if (cur < prev && prev > twoBefore) {
		bearSwitch[i] = cur;
	} else {
		bearSwitch[i] = null;
	}
}

const showShapes = input.boolean("Show Shapes", true)
if(showShapes)
{
	paint(bullSwitch, { name: "Shapes - Bull Switch", style: 'dotted', thickness: 8, color: `rgba(0, 230, 118, 0.2)` });
	paint(bearSwitch, { name: "Shapes - Bear Switch", style: 'dotted', thickness: 8, color: `rgba(255, 82, 82, 0.2)` });
}