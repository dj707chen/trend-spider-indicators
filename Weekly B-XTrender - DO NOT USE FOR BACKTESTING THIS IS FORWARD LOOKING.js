let tinycolor = library("tinycolor2");
describe_indicator('Weekly Market Bias');

// Inputs
const ha_len = input.number('Period', 20);
const ha_len2 = input.number('Smoothing', 8);
const col_bull = input.color('Color: Bullish', 'lime');
const col_bear = input.color('Bearish', 'red');
const osc_len = input.number("Oscillator Period", 8);
const showValues = input.boolean("Show Values", false);

const weeklyData = await request.history(current.ticker, 'W',{ chart_type: "candles", ext_session: false });

// Smoothen the OHLC values 
const o = ema(weeklyData.open, ha_len);
const c = ema(weeklyData.close, ha_len);
const h = ema(weeklyData.high, ha_len);
const l = ema(weeklyData.low, ha_len);
//debugger;
// Initialize arrays to store Heikin-Ashi values
let haopen = [];
let hahigh = [];
let halow = [];
let haclose = [];

// Initialize the first Heikin-Ashi OHLC values
let aOpen = o.length > 0 ? o[0] : 0;
let aClose = c.length > 0 ? c[0] : 0;

for (let i = 0; i < o.length; i++) {
    const hopen = o[i];
    const hhigh = h[i];
    const hlow = l[i];
    const hclose = c[i];

    const haCloseCurrent = (hopen + hhigh + hlow + hclose) / 4;
    const haOpenCurrent = (aOpen + aClose) / 2;
    const haHighCurrent = Math.max(hhigh, haOpenCurrent, haCloseCurrent);
    const haLowCurrent = Math.min(hlow, haOpenCurrent, haCloseCurrent);

	if(hopen === null || hhigh ===null || hlow === null || hclose == null)
	{
		haopen.push(null);
	    hahigh.push(null);
	    halow.push(null);
	    haclose.push(null);
	}
	else{
	    haopen.push(haOpenCurrent);
	    hahigh.push(haHighCurrent);
	    halow.push(haLowCurrent);
	    haclose.push(haCloseCurrent);
	}

    // Update for the next iteration
    aOpen = haOpenCurrent;
    aClose = haCloseCurrent;
}

// Smoothen the Heiken Ashi Candles
let o2 = ema(haopen, ha_len2)
let c2 = ema(haclose, ha_len2)
let h2 = ema(hahigh, ha_len2)
let l2 = ema(halow, ha_len2)

o2 = shift(o2,-1);
c2 = shift(c2,-2);

//debugger;
// Oscillator
let osc_bias = c2.map((value, index) => 100 * (value - o2[index]));
let osc_smooth = ema(osc_bias, osc_len)

const osc_bias_interp = interpolate_sparse_series(land_points_onto_series(weeklyData.time, osc_bias, time),"constant")
const osc_smooth_interp = interpolate_sparse_series(land_points_onto_series(weeklyData.time, osc_smooth, time),"constant")
//debugger
const h2_interp = interpolate_sparse_series(land_points_onto_series(weeklyData.time, h2, time),"constant")
const l2_interp = interpolate_sparse_series(land_points_onto_series(weeklyData.time, l2, time),"constant")

const doubleBullAreaTop = Array(osc_bias_interp.length).fill(null);
const doubleBullAreaBottom = Array(osc_bias_interp.length).fill(null);
const bullAreaTop = Array(osc_bias_interp.length).fill(null);
const bullAreaBottom = Array(osc_bias_interp.length).fill(null);
const doubleBearAreaTop = Array(osc_bias_interp.length).fill(null);
const doubleBearAreaBottom = Array(osc_bias_interp.length).fill(null);
const bearAreaTop = Array(osc_bias_interp.length).fill(null);
const bearAreaBottom = Array(osc_bias_interp.length).fill(null);

const BullBearInd = Array(osc_bias_interp.length).fill(null);

//debugger;
const sigcolor = for_every(osc_bias_interp, osc_smooth_interp, (bias, smooth ,prevValue, index) => {
    if (bias > 0 && bias >= smooth){
		doubleBullAreaTop[index] = h2_interp[index];
		doubleBullAreaBottom[index] = l2_interp[index];
		BullBearInd[index] = 1;
		return tinycolor(col_bull).setAlpha(0.95).toRgbString();
	}
    if (bias > 0 && bias < smooth) {
		bullAreaTop[index] = h2_interp[index];
		bullAreaBottom[index] = l2_interp[index];
		BullBearInd[index] = 1;
		return tinycolor(col_bull).setAlpha(0.15).toRgbString();
	}
    if (bias < 0 && bias <= smooth) {
		doubleBearAreaTop[index] = h2_interp[index];
		doubleBearAreaBottom[index] = l2_interp[index];
		BullBearInd[index] = 0;
		return tinycolor(col_bear).setAlpha(0.95).toRgbString();
	}
    if (bias < 0 && bias > smooth) {
		bearAreaTop[index] = h2_interp[index];
		bearAreaBottom[index] = l2_interp[index];
		BullBearInd[index] = 0;
		return tinycolor(col_bear).setAlpha(0.15).toRgbString();
	}
    return null;
});

//PLOTS
let p_h = paint(h2_interp, "Bias High", sigcolor,'line',1, false, false, true);
let p_l = paint(l2_interp, "Bias Low", sigcolor,'line',1, false, false, true);
let p_bb = paint(BullBearInd, "BullBearInd", sigcolor,'line',10, false, false, true);

if(showValues)
{
for (let i = 0; i < h2.length; i++) {
    paint_label_at_line(p_h, i, ''+(Math.round(h2_interp[i] * 10) / 10));
	paint_label_at_line(p_l, i, ''+(Math.round(l2_interp[i] * 10) / 10));
}
}

//Given a sigcolor will return the array it corresponds to
const getBottomArrayByColor = (color) => {
	if(color === null) return null;
	if (color == tinycolor(col_bull).setAlpha(0.95).toRgbString())
		return doubleBullAreaBottom
	if (color == tinycolor(col_bull).setAlpha(0.15).toRgbString())
		return bullAreaBottom
	if (color == tinycolor(col_bear).setAlpha(0.95).toRgbString())
		return doubleBearAreaBottom
	if (color == tinycolor(col_bear).setAlpha(0.15).toRgbString())
		return bearAreaBottom
}

const getTopArrayByColor = (color) => {
	if(color === null) return null;
	if (color == tinycolor(col_bull).setAlpha(0.95).toRgbString())
		return doubleBullAreaTop
	if (color == tinycolor(col_bull).setAlpha(0.15).toRgbString())
		return bullAreaTop
	if (color == tinycolor(col_bear).setAlpha(0.95).toRgbString())
		return doubleBearAreaTop
	if (color == tinycolor(col_bear).setAlpha(0.15).toRgbString())
		return bearAreaTop
}

//Fills in blank spaces in the background color
function fillTopArray(arr)  {
// Create a copy of the original array
  let newArr = [...arr];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === null && arr[i-1] !== null) {
	  let nextArray = getTopArrayByColor(sigcolor[i]);
      if(nextArray === null) continue;
      newArr[i] = nextArray[i];
    }
  }
  return newArr;
}

function fillBottomArray(arr)  {
// Create a copy of the original array
  let newArr = [...arr];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === null && arr[i-1] !== null) {
	  let nextArray = getBottomArrayByColor(sigcolor[i]);
      if(nextArray === null) continue;
      newArr[i] = nextArray[i];
    }
  }
  return newArr;
}


debugger

fill(
	paint(fillTopArray(doubleBullAreaTop ), "", "random color", "line", 1, true, true),
	paint( fillBottomArray(doubleBullAreaBottom ), "", "random color", "line", 1, true, true),
	col_bull, 0.95,""
);

fill(
	paint(fillTopArray(bullAreaTop ), "", "random color", "line", 1, true, true),
	paint(fillBottomArray(bullAreaBottom ), "", "random color", "line", 1, true, true),
	col_bull ,0.15,""
);

fill(
	paint(fillTopArray(doubleBearAreaTop ), "", "random color", "line", 1, true, true),
	paint(fillBottomArray(doubleBearAreaBottom), "", "random color", "line", 1, true, true),
	col_bear, 0.95,""
);

fill(
	paint(fillTopArray(bearAreaTop), "", "random color", "line", 1, true, true),
	paint(fillBottomArray(bearAreaBottom), "", "random color", "line", 1, true, true),
	col_bear, 0.15, ""
);

