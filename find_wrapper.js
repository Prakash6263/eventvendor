const {vendorMarkup} = require('./app/generated/vendorMarkup');
const html = vendorMarkup['vendor-dashboard.html'];

// Find the wrapper class
const wrapperIdx = html.indexOf('class="wrapper"');
if (wrapperIdx !== -1) {
  console.log('Wrapper div found!');
  console.log(html.substring(wrapperIdx - 50, wrapperIdx + 300));
} else {
  console.log('No wrapper class="wrapper" found');
  // Search for div before event-dt-block
  const idx = html.indexOf('event-dt-block');
  // Find all divs before it
  let searchPos = 0;
  const divPositions = [];
  while (searchPos < idx) {
    const nextDiv = html.indexOf('<div', searchPos);
    if (nextDiv === -1 || nextDiv >= idx) break;
    divPositions.push(nextDiv);
    searchPos = nextDiv + 1;
  }
  // Show the last 3 divs before event-dt-block
  const lastDivs = divPositions.slice(-3);
  for (const pos of lastDivs) {
    const endClass = html.indexOf('>', pos);
    console.log('Div before event-dt-block:', html.substring(pos, Math.min(endClass + 1, pos + 200)));
  }
}
