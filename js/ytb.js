chrome.runtime.onMessage.addListener((message) => {
  if(message.action === 'maximizeVideo-ytb') {
    const ytpSizeButton = document.querySelector('.ytp-size-button');
    if (ytpSizeButton) {
      document.body.classList.add('mvytp');
      const ytdWatchFlexy = document.querySelector('ytd-watch-flexy');
      let theater_mode = ytdWatchFlexy.hasAttribute('theater');
      if (!theater_mode) {
        ytdWatchFlexy.setAttribute('mv', '');
        ytpSizeButton.click();
      }
      setTimeout(()=>{
        window.dispatchEvent(new Event('resize'));
      }, 10);
    }
  }
  else if(message.action === 'cancelMaximaMode-ytb') {
    const ytpSizeButton = document.querySelector('.ytp-size-button');
    if (ytpSizeButton) {
      document.body.classList.remove('mvytp');
      const ytdWatchFlexy = document.querySelector('ytd-watch-flexy');
      if (ytdWatchFlexy.hasAttribute('mv')) {
        ytdWatchFlexy.removeAttribute('mv');
        window.dispatchEvent(new Event('resize'))
        setTimeout(()=>{
          ytpSizeButton.click();
        }, 10);
      }
    }
  }
})
