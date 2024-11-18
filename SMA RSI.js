describe_indicator('SMA RSI','lower');
const RSIlength = input.number('RSI Length', 14, { min: 2, max: 1000 });
const SMAlength = input.number('SMA Length', 7, { min: 2, max: 1000 });
const ma = sma(rsi(close, RSIlength), SMAlength);
paint(ma, 'SMA RSI');