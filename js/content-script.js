let currentPrefs = {};
let init = false;

const shortcutFuncs = {
  toggleCaptions: function(v){
    const validTracks = [];
    for(let i = 0; i < v.textTracks.length; ++i){
      const tt = v.textTracks[i];
      if(tt.mode === 'showing'){
        tt.mode = 'disabled';
        if(v.textTracks.addEventListener){
          // If text track event listeners are supported
          // (they are on the most recent Chrome), add
          // a marker to remember the old track. Use a
          // listener to delete it if a different track
          // is selected.
          v.cbhtml5vsLastCaptionTrack = tt.label;
          function cleanup(e){
            for(let i = 0; i < v.textTracks.length; ++i){
              const ott = v.textTracks[i];
              if(ott.mode === 'showing'){
                delete v.cbhtml5vsLastCaptionTrack;
                v.textTracks.removeEventListener('change', cleanup);
                return;
              }
            }
          }
          v.textTracks.addEventListener('change', cleanup);
        }
        return;
      }else if(tt.mode !== 'hidden'){
        validTracks.push(tt);
      }
    }
    // If we got here, none of the tracks were selected.
    if(validTracks.length === 0){
      return true; // Do not prevent default if no UI activated
    }
    // Find the best one and select it.
    validTracks.sort(function(a, b){

      if(v.cbhtml5vsLastCaptionTrack){
        const lastLabel = v.cbhtml5vsLastCaptionTrack;

        if(a.label === lastLabel && b.label !== lastLabel){
          return -1;
        }else if(b.label === lastLabel && a.label !== lastLabel){
          return 1;
        }
      }

      const aLang = a.language.toLowerCase(),
            bLang = b.language.toLowerCase(),
            navLang = navigator.language.toLowerCase();

      if(aLang === navLang && bLang !== navLang){
        return -1;
      }else if(bLang === navLang && aLang !== navLang){
        return 1;
      }

      const aPre = aLang.split('-')[0],
            bPre = bLang.split('-')[0],
            navPre = navLang.split('-')[0];

      if(aPre === navPre && bPre !== navPre){
        return -1;
      }else if(bPre === navPre && aPre !== navPre){
        return 1;
      }

      return 0;
    })[0].mode = 'showing';
  },

  togglePlay: function(v){
    if(v.paused)
      v.play();
    else
      v.pause();
  },

  toStart: function(v){
    v.currentTime = 0;
  },

  toEnd: function(v){
    v.currentTime = v.duration;
  },

  skipLeft: function(v,key,shift,ctrl){
    if(shift)
      v.currentTime -= 10;
    else if(ctrl)
      v.currentTime -= 1;
    else
      v.currentTime -= 5;
  },

  skipRight: function(v,key,shift,ctrl){
    if(shift)
      v.currentTime += 10;
    else if(ctrl)
      v.currentTime += 1;
    else
      v.currentTime += 5;
  },

  increaseVol: function(v){
    if(v.volume <= 0.9) v.volume += 0.1;
    else v.volume = 1;
  },

  decreaseVol: function(v){
    if(v.volume >= 0.1) v.volume -= 0.1;
    else v.volume = 0;
  },

  toggleMute: function(v){
    v.muted = !v.muted;
  },

  toggleFS: function(v){
    v.requestFullscreen();
  },

  slow: function(v,key,shift){
    if(v.playbackRate >= 0.25) v.playbackRate -= 0.25;
    else v.playbackRate = 0.01;
  },

  fast: function(v,key,shift){
    v.playbackRate += 0.25;
  },

  normalSpeed: function(v,key,shift){
    v.playbackRate = v.defaultPlaybackRate;
  },

  toPercentage: function(v,key){
    v.currentTime = v.duration * (key - 48) / 10.0;
  },
};

const keyFuncs = {
  32 : shortcutFuncs.togglePlay,      // Space
  75 : shortcutFuncs.togglePlay,      // K
  35 : shortcutFuncs.toEnd,           // End
  48 : shortcutFuncs.toStart,         // 0
  36 : shortcutFuncs.toStart,         // Home
  37 : shortcutFuncs.skipLeft,        // Left arrow
  74 : shortcutFuncs.skipLeft,        // J
  39 : shortcutFuncs.skipRight,       // Right arrow
  76 : shortcutFuncs.skipRight,       // L
  38 : shortcutFuncs.increaseVol,     // Up arrow
  40 : shortcutFuncs.decreaseVol,     // Down arrow
  77 : shortcutFuncs.toggleMute,      // M
  70 : shortcutFuncs.toggleFS,        // F
  67 : shortcutFuncs.toggleCaptions,  // C
  188: shortcutFuncs.slow,            // Comma
  190: shortcutFuncs.fast,            // Period
  191: shortcutFuncs.normalSpeed,     // Forward slash
  49 : shortcutFuncs.toPercentage,    // 1
  50 : shortcutFuncs.toPercentage,    // 2
  51 : shortcutFuncs.toPercentage,    // 3
  52 : shortcutFuncs.toPercentage,    // 4
  53 : shortcutFuncs.toPercentage,    // 5
  54 : shortcutFuncs.toPercentage,    // 6
  55 : shortcutFuncs.toPercentage,    // 7
  56 : shortcutFuncs.toPercentage,    // 8
  57 : shortcutFuncs.toPercentage,    // 9
};

const setMiniPlayer = (impl, disable) => {
  const settingsButton = document.querySelector('[data-a-target="player-settings-button"]');
  try {
    settingsButton.click();
    document.querySelector('[data-a-target="player-settings-menu-item-advanced"]').click();
    const menuItem = document.querySelector('[data-a-target="player-settings-submenu-advanced-toggle-mini"]');
    const input = menuItem.querySelector('input');
    if (disable) {
      if (input.checked) {
        impl.miniPlayer = true;
        input.click();
      }
    } else {
      if (!!impl.miniPlayer && !input.checked) {
        input.click();
      }
    }
    settingsButton.click();
  } catch (e) {
  } finally {
    settingsButton.click();
  }
}

function MVUniversal() {}
MVUniversal.prototype={
  topTags: [],
  mvClass: 'show',
  setCoreNode: function () {
  },
  restoreCoreNode: function () {
  },
  getMainNode: function (node) {
    return node;
  },
  setControllers: function (show) {
    let node = this.selectedNode;
    let tagName = node.tagName.toLocaleLowerCase();
    if(tagName === 'video' || tagName === 'iframe') {
      let attribute = tagName === 'video' ? 'controls' : 'allowfullscreen';
      if(show) {
        this.original[attribute] = node.hasAttribute(attribute) ? node.getAttribute(attribute) : null;
        node.setAttribute(attribute, 'true');
      }
      // let script = document.createElement('script');
      // script.setAttribute('id','mvScript');
      // script.textContent = '(function(){Object.defineProperty(document.querySelector("video[mvHashCode='+this.currentHashCode+']"), "'+attribute+'", {configurable: false});document.head.removeChild(document.getElementById("mvScript"));})()';
      // document.head.appendChild(script);
      if(!show) {
        if(this.original[attribute] !== null)
          node.setAttribute(attribute, this.original[attribute]);
        else
          node.removeAttribute(attribute);
      }
    }
  },
  registerEvents: function(node) {
    if(!node.hasAttribute('mvEventReg')) {
      node.setAttribute('mvEventReg', 'true');
      node.addEventListener('click', event => {
        if(this.status === 'maximaVideo')
          event.stopImmediatePropagation();
      }, true);
      node.addEventListener('mousedown', event => {
        if(this.status === 'maximaVideo')
          event.stopImmediatePropagation();
      }, true);
      node.addEventListener('mouseup', event => {
        if(this.status === 'maximaVideo')
          event.stopImmediatePropagation();
      }, true);
    }
  }
}

function MVTwitch() {}
MVTwitch.prototype={
  topTags: ['body', 'html'],
  mvClass: 'show-t',
  setCoreNode: function () {
    let coreNode = document.querySelector('.player-controls');
    coreNode.parentNode.setAttribute('mvclass', 'core');
    coreNode.setAttribute('mvclass', 'core');
    setMiniPlayer(this, true);
  },
  restoreCoreNode: function () {
    setMiniPlayer(this, false);
  },
  getMainNode: function (node) {
    return document.querySelector('.video-player__container');
  },
  setControllers: function (show, node) {
  },
  registerEvents: function () {
  }
}

function MVETwitch() {}
MVETwitch.prototype={
  topTags: ['body', 'html'],
  mvClass: 'show-t',
  setCoreNode: function () {
    let controlsNode = document.querySelector('.pl-controls-bottom');
    controlsNode.setAttribute('mvclass', 'core');
    controlsNode.parentNode.setAttribute('mvclass', 'core');
    let hoverDisplay = document.querySelector('.hover-display');
    hoverDisplay.setAttribute('mvclass', 'core');
    let playerui = document.querySelector('.player-ui');
    if(playerui) {
      playerui.setAttribute('mvclass', 'core');
    }
  },
  restoreCoreNode: function () {
  },
  getMainNode: function (node) {
    return node;
  },
  setControllers: function (show, node) {
  },
  registerEvents: function () {
  }
}

function MVNetflix() {}
MVNetflix.prototype={
  topTags: ['body', 'html'],
  mvClass: 'show-t',
  setCoreNode: function () {
    document.querySelector('.controls').setAttribute('mvclass', 'core');
  },
  restoreCoreNode: function () {
  },
  getMainNode: function (node) {
    return node;
  },
  setControllers: function (show, node) {
  },
  registerEvents: function () {
  }
}

const HASHCODE_LENGTH = 32;
let mvImpl;
let idCount = 0;
let vnStyle = [
  'position:fixed !important;',
  'top:0 !important;',
  'left:0 !important;',
  'min-width:0 !important;',
  'min-height:0 !important;',
  'min-width:100vw !important;',
  'min-height:100vh !important;',
  'width:100vw !important;',
  'height:100vh !important;',
  'max-width:100vw !important;',
  'max-height:100vh !important;',
  'max-width:100% !important;',
  'max-height:100% !important;',
  'margin:0 !important;',
  'padding:0 !important;',
  'transform:none !important;',
  'visibility:visible !important;',
  'border-width:0 !important;',
  'cursor:default !important;',
  'object-fit:contain !important;',
  'z-index: 2147483639 !important;',
].join('');
let vnStyleList = [
  'position', 'top', 'left', 'min-width',
  'min-height', 'width', 'height',
  'max-width', 'max-height', 'margin',
  'padding', 'visibility', 'border-width',
  'cursor'];

if(window.location.href.startsWith('https://www.twitch.tv/')) {
  mvImpl = new MVTwitch();
}
else if(window.location.href.startsWith('https://player.twitch.tv/')) {
  mvImpl = new MVETwitch();
}
else if(window.location.href.startsWith('https://www.netflix.com/')) {
  mvImpl = new MVNetflix();
}
else {
  mvImpl = new MVUniversal();
}
mvImpl.status = 'normal';
mvImpl.original = {};
mvImpl.updateTimer = null;

function getHashCode(length) {
  let hashCode = '';
  let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let max = characters.length;
  for(let i = 0; i < length; ++i) {
    let r = Math.floor((Math.random() * (i === 0 ? 52 : 62) )); //don't start with number
    //let r = Math.floor(Math.random() * max);
    let char = characters.charAt(r);
    hashCode += char;
  }
  return hashCode;
}
let selfId = getHashCode(HASHCODE_LENGTH);

function isYoutubeEmbed () {
  return window.location.href.startsWith('https://www.youtube.com/embed/');
}
function isYoutubeWatch () {
  return window.location.href.startsWith('https://www.youtube.com/watch');
}

function addToMvCover (elemInfo) {
  // console.log('[addToMvCover] ' + JSON.stringify(elemInfo, null, 4));
  // console.log(new Date());
  let diffTime = 0;
  let allBlock = [];
  diffTime = new Date() - mvImpl.startScanTime;

  if(mvImpl.status !== 'selectVideo')
    return;
  let cover = document.querySelector('.mvCover');
  let videoBlocks = document.querySelectorAll('.mvVideoBlock');
  //let videoBlocks = document.querySelectorAll('.mvVideoBlock');

  let bodyPosition = window.getComputedStyle(document.body,null).getPropertyValue('position');
  let found = false;
  for(let v of videoBlocks) {
    let h = v.getAttribute('mvMaskHash');
    if(h === elemInfo.hashCode) {
      //update
      v.style.left = elemInfo.left + 'px';
      v.style.top = elemInfo.top + 'px';
      v.style.width = elemInfo.width + 'px';
      v.style.height = elemInfo.height + 'px';
      v.style.display = elemInfo.visible ? 'block' : 'none';
      found = true;
      break;
    }
  }
  if(!found) {
    let videoBlock = document.createElement('DIV');
    videoBlock.classList.add('mvVideoBlock');
    if(elemInfo.source)
      videoBlock.classList.add('mvHighLevel');
    videoBlock.setAttribute('tn', elemInfo.tagName);
    videoBlock.style.left = elemInfo.left + 'px';
    videoBlock.style.top = elemInfo.top + 'px';
    videoBlock.style.width = elemInfo.width + 'px';
    videoBlock.style.height = elemInfo.height + 'px';
    videoBlock.setAttribute('mvMaskHash', elemInfo.hashCode);
    //videoBlock.textContent = elemInfo.hashCode;
    videoBlock.addEventListener('mousedown', event => {
      if(event.button === 0) {
        event.stopImmediatePropagation();
        event.preventDefault();
        let msg = {action: 'maximizeVideo', hashCode: elemInfo.hashCode};
        try{
          if(event.shiftKey && event.layerX < 10 && event.layerY < 10 ) msg.strict = true;
        } catch (ex){}
        chrome.runtime.sendMessage(msg);
      }
    },true);
    document.body.appendChild(videoBlock);
    videoBlock.style.position = bodyPosition==='fixed' ? 'fixed' : 'absolute';
    videoBlock.style.display = elemInfo.visible ? 'block' : 'none';
    allBlock.push(videoBlock);
  }

  for(let v of videoBlocks) {
    v.style.position = bodyPosition==='fixed' ? 'fixed' : 'absolute';
    allBlock.push(v);
  }

  if(mvImpl.toolbarAction === 1 && diffTime > 600) {
    let selected = null;
    for(let v of videoBlocks) {
      if(!selected) {
        selected = v;
      }
      else {
        if(parseInt(v.style.width) * parseInt(v.style.height) > parseInt(selected.style.width) * parseInt(selected.style.height)) {
          selected = v;
        }
      }
    }
    if(selected) {
      mvImpl.toolbarAction = 0;
      chrome.runtime.sendMessage({action: 'maximizeVideo', hashCode: selected.getAttribute('mvMaskHash')});
    }
  }
}

function lockMainNodeStyle(lock) {
  if(lock) {
    if(mvImpl.strict) {
      //no way to unlock.
      let script = document.createElement('script');
      script.setAttribute('id','mvLockScript');
      script.textContent = '(function(){Object.defineProperty(document.querySelector("[mvHashCode='+mvImpl.currentHashCode+']"), "style", {configurable: false});document.head.removeChild(document.getElementById("mvLockScript"));})()';
      document.head.appendChild(script);
    }
    else {
      let observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          let n = mutation.target;
          let currentStyle = n.getAttribute('style');
          if(currentStyle !== mvImpl.vnNewStyle) {
            n.setAttribute('style', mvImpl.vnNewStyle);
          }
        });
      });
      let config = { attributes: true, attributeFilter: ['style']};
      observer.observe(mvImpl.mainNode, config);
      mvImpl.mainNodeObserver = observer;
    }
  }
  else {
    if(mvImpl.mainNodeObserver) {
      mvImpl.mainNodeObserver.disconnect();
      mvImpl.mainNodeObserver = null;
    }
  }
}

function maximizeMainNode() {
  let originalStyle = mvImpl.originalStyle = (mvImpl.mainNode.getAttribute('style') || '');
  let fixedStyle = vnStyle;
  let fixedStyleList = [...vnStyleList]
  let vnNewStyle = '';
  originalStyle = originalStyle.trim().replace(/\r\n/g, '\r').replace(/\n/g, '\r').replace(/\r/g, '');
  if (originalStyle === '') {
    vnNewStyle = fixedStyle;
  }
  else {
    let styles = originalStyle.split(';');
    let slist = [];
    for (let s of styles) {
      let t = /([a-zA-Z-]{2,})\s?:\s?(.+)/;
      if(t.test(s)) {
        let m = s.split(t);
        let key = m[1];
        let value = m[2];
        if (!fixedStyleList.includes(key)) {
          slist.push(key+':'+value);
        }
      }
    }
    if (slist.length === 0) {
      vnNewStyle = fixedStyle;
    }
    else {
      vnNewStyle = fixedStyle + slist.join(';')+';';
    }
  }
  mvImpl.vnNewStyle = vnNewStyle;
  mvImpl.mainNode.setAttribute('style', vnNewStyle);
  lockMainNodeStyle(true);
};

function restoreVideo() {
  if (!mvImpl.selectedNode) return;
  if (!mvImpl.youtubeControllers || (!isYoutubeEmbed() && !isYoutubeWatch())) {
    mvImpl.setControllers(false);
  }
  lockMainNodeStyle(false);
  mvImpl.mainNode.setAttribute('style', mvImpl.originalStyle);

  let mvClassList = [mvImpl.mvClass, 'core'];
  for(let cn of mvClassList) {
    let nodes = document.querySelectorAll('[mvclass='+cn+']');
    for(let node of nodes) {
      node.removeAttribute('mvclass');
    }
  }
};

function maximizeVideo(selectedNode) {
  const hideAllSibling = (node) => {
    if(node === mvImpl.mainNode) {
      node.setAttribute('mvclass', 'core');
    }
    else{ // if(node !== mvImpl.mainNode) {
      node.setAttribute('mvclass', mvImpl.mvClass);
    }

    let parent = node.parentNode;
    if(parent && parent.nodeType === Node.ELEMENT_NODE) {
      if(!mvImpl.topTags.includes(parent.tagName.toLocaleLowerCase())) {
        hideAllSibling(parent);
      }
    }
  };

  mvImpl.selectedNode = selectedNode;
  if (!mvImpl.youtubeControllers || (!isYoutubeEmbed() && !isYoutubeWatch())) {
    mvImpl.setControllers(true);
  }
  mvImpl.mainNode = mvImpl.getMainNode(selectedNode);
  if(window !== window.top) { //this video is in iframe
    window.parent.postMessage({action: 'getId', senderId: selfId, nextAction: 'setVideoNode'},'*');
  }
  mvImpl.registerEvents(mvImpl.mainNode);
  if (!mvImpl.youtubeControllers || (!isYoutubeEmbed() && !isYoutubeWatch())) {
    hideAllSibling(mvImpl.mainNode);
  }
  maximizeMainNode();
}

function getChildIFrameById(id) {
  let iframes = document.getElementsByTagName('IFRAME');
  for(let iframe of iframes) {
    if(iframe.getAttribute('mv_iframe') === id) {
      return iframe;
    }
  }
}

window.addEventListener('message', e => {
  if (e.data.action === 'getId') { //message from child
    let iframes = document.getElementsByTagName('IFRAME');
    for(let iframe of iframes) {
      let vmi = iframe.getAttribute('mv_iframe');
      if(!vmi) {
        iframe.setAttribute('mv_iframe', idCount);
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.contentWindow.postMessage({action: 'setId', reciver: e.data.senderId, id: iframe.getAttribute('mv_iframe'), nextAction: e.data.nextAction, extDate: e.data.extDate}, '*');
        idCount++;
      }
      else if(vmi) {
        iframe.contentWindow.postMessage({action: 'setId', reciver: e.data.senderId, id: iframe.getAttribute('mv_iframe'), nextAction: e.data.nextAction, extDate: e.data.extDate}, '*');
      }
    }
  }
  else if (e.data.action === 'setId') { //message from parent
    if(e.data.reciver !== selfId) {
      return;
    }
    if(e.data.nextAction === 'setVideoNode') {
      if(mvImpl.mainNode && window !== window.top) {
        window.parent.postMessage({action: 'setVideoNode', id: e.data.id},'*');
      }
    }
    else if(e.data.nextAction === 'addVideoElements') {
      window.parent.postMessage({action: 'addVideoElements', id: e.data.id, elemInfos: e.data.extDate},'*');
    }
  }
  else if(e.data.action === 'setVideoNode'){ //message from child
    let iframe = getChildIFrameById(e.data.id);
    let hashCode = iframe.getAttribute('mvHashCode');
    if(!hashCode) {
      hashCode = getHashCode(HASHCODE_LENGTH);
      iframe.setAttribute('mvHashCode', hashCode);
    }
    mvImpl.currentHashCode = hashCode;
    maximizeVideo(iframe);
    // if(window !== window.top) {
    //   window.parent.postMessage({action: 'getId', senderId: selfId, nextAction: 'setVideoNode'},'*');
    // }
  }
  else if(e.data.action === 'addVideoElements'){ //message from child
    let iframe = getChildIFrameById(e.data.id);
    let iframeRect = iframe.getBoundingClientRect();
    if(window !== window.top) {
      for(let elemInfo of e.data.elemInfos) {
        elemInfo.left += iframeRect.left + window.scrollX;
        elemInfo.top += iframeRect.top + window.scrollY;
      }
      window.parent.postMessage({action: 'getId', senderId: selfId, nextAction: 'addVideoElements', extDate: e.data.elemInfos},'*');
    }
    else {
      for(let elemInfo of e.data.elemInfos) {
        elemInfo.left += iframeRect.left + window.scrollX;
        elemInfo.top += iframeRect.top + window.scrollY;
        addToMvCover(elemInfo);
      }
    }
  }
});

window.addEventListener('keydown', event => {
  if(event.key === 'Escape' && mvImpl.status === 'selectVideo') {
    chrome.runtime.sendMessage({action: 'cancelSelectMode'});
  } else if (mvImpl.status === 'maximaVideo') {
    if (event.altKey || event.metaKey || event.ctrlKey) {
      return true;
    }
    const func = keyFuncs[event.keyCode];
    if(func){
      //send message to background script !
      //func(mvImpl.mainNode, event.keyCode, event.shiftKey, event.ctrlKey);
      if(event.keyCode === 70) {// fullscreen
        mvImpl.mainNode.requestFullscreen();
      }
      else {
        let msg = {action: 'videoHotkey', keyCode: event.keyCode, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey};
        chrome.runtime.sendMessage(msg);
      }
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
    return true;
  }
}, true);

const handleKeyEvent = (event) => {
  if (mvImpl.status === 'maximaVideo') {
    if(event.altKey || event.metaKey){
      return true;
    }
    const func = keyFuncs[event.keyCode];
    if(func){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
    return true;
  }
}
window.addEventListener('keypress', handleKeyEvent, true);
window.addEventListener('keyup', handleKeyEvent, true);
window.addEventListener('DOMContentLoaded', event => {
  document.addEventListener('fullscreenchange', event => {
    if (mvImpl.status === 'maximaVideo' && !mvImpl.youtubeControllers && !mvImpl instanceof MVTwitch && !mvImpl instanceof MVETwitch) {
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);
});

function inRect(point, rect) {
  return (point.x > rect.left && point.x < rect.right &&
  point.y > rect.top && point.y < rect.bottom);
}

function intersectRect(r1, r2) {
  return !(r2.left > r1.right ||
           r2.right < r1.left ||
           r2.top > r1.bottom ||
           r2.bottom < r1.top);
}

function isVisible(elem, elemRect) {
  const style = getComputedStyle(elem);
  if (style.display === 'none') return false;
  if (style.visibility !== 'visible') return false;
  if (style.opacity < 0.1) return false;
  let r = {left:0, top:0, right: window.innerWidth, bottom: window.innerHeight};
  if(intersectRect(r, elemRect)) {
    return true;
  }
  else {
    return false;
  }
}

function getElemInfo(elem) {
  let elemRect = elem.getBoundingClientRect();
  if(isYoutubeEmbed() && !elem.src) {
    let newElemRect = {
      bottom: elemRect.bottom,
      height: elemRect.height,
      left: elemRect.left,
      right: elemRect.right,
      top: elemRect.top,
      width: elemRect.width,
      x: elemRect.x,
      y: elemRect.y
    };
    elemRect = newElemRect;
    elemRect.y = elemRect.top = 0;
    elemRect.bottom = elemRect.height;
  }
  let hashCode = elem.getAttribute('mvHashCode');
  let foundSource = false;
  if(!hashCode) {
    hashCode = getHashCode(HASHCODE_LENGTH);
    elem.setAttribute('mvHashCode', hashCode);
  }

  if(elem.getAttribute('src')) {
    foundSource = true;
  }
  else {
    if(elem.querySelector('source[src]')) {
      foundSource = true;
    }
  }
  return {
    tagName: elem.tagName.toLocaleLowerCase(),
    left: elemRect.left + window.scrollX,
    top: elemRect.top + window.scrollY,
    width: elemRect.width,
    height: elemRect.height,
    hashCode: hashCode,
    source: foundSource,
    visible: isVisible(elem, elemRect),
    path: []
  };
}

function uploadElemInfo(elements, minWidth, minHeight, onlyUpdateNewElem) {
  let elemInfos = [];
  for(let elem of elements) {
    let mvHashCode = elem.getAttribute('mvHashCode');
    if(onlyUpdateNewElem && mvHashCode)
      continue;
    let elemInfo = getElemInfo(elem);
    if(elemInfo.width >= minWidth && elemInfo.height >= minHeight) {
      if(window === window.top) {
        addToMvCover(elemInfo); // 是 top window, 直接加進去
      }
      else {
        elemInfos.push(elemInfo);
      }
    }
  }
  // TODO: Need fix this
  // if(window !== window.top && elemInfos.length) {
  //   window.parent.postMessage({action: 'getId', senderId: selfId, nextAction: 'addVideoElements', extDate: elemInfos},'*');
  // }
}

function removeVideoMask() {
  if(window === window.top) {
    let elem = document.querySelector('.mvCover');
    if(elem)
      elem.parentNode.removeChild(elem);
    let videoBlocks = document.querySelectorAll('.mvVideoBlock');
    for(let v of videoBlocks) {
      v.parentNode.removeChild(v);
    }
  }
}

function clearHideCursorTimer() {
  if(mvImpl.hideCursorTimer) {
    clearTimeout(mvImpl.hideCursorTimer);
    mvImpl.hideCursorTimer = null;
  }
}

function setHideCursorTimer() {
  clearHideCursorTimer();
  if(currentPrefs.autoHideCursor) {
    mvImpl.hideCursorTimer = setTimeout(()=>{
      mvImpl.vnNewStyle = mvImpl.vnNewStyle.replace('cursor:default','cursor:none');
      mvImpl.mainNode.setAttribute('style', mvImpl.vnNewStyle);

      mvImpl.mainNode.addEventListener('mousemove', e => {
        mvImpl.vnNewStyle = mvImpl.vnNewStyle.replace('cursor:none','cursor:default');
        mvImpl.mainNode.setAttribute('style', mvImpl.vnNewStyle);
        setHideCursorTimer();
      }, {capture: true, once: true}); // FF50+, Ch55+
    }, 6000); //currentPrefs.delayForHideCursor*1000
  }
}

chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
  if(message.action === 'videoHotkey') {
    if(mvImpl.mainNode.tagName === 'VIDEO') {
      const func = keyFuncs[message.keyCode];
      func(mvImpl.mainNode, message.keyCode, message.shiftKey, message.ctrlKey);
    }
  }
  else if(message.action === 'maximizeVideo') {
    if(mvImpl.status === 'maximaVideo')
      return;
    mvImpl.status = 'maximaVideo';
    removeVideoMask();
    let elements = document.querySelectorAll('video');
    for(let v of elements) {
      if(v.getAttribute('mvHashCode') !== message.hashCode)
        v.pause();
    }

    let elem = document.querySelector('video[mvHashCode="'+message.hashCode+'"],embed[mvHashCode="'+message.hashCode+'"][type="application/x-shockwave-flash"],object[mvHashCode="'+message.hashCode+'"][type="application/x-shockwave-flash"]');
    if(elem) {
      initPrefs( ()=>{
        setHideCursorTimer();
      });
      mvImpl.setCoreNode();
      mvImpl.currentHashCode = message.hashCode;
      mvImpl.youtubeControllers = message.youtubeControllers;
      if(isYoutubeEmbed() && !elem.src) {
        elem.click();
        elem.addEventListener('progress', ()=>{
          elem.pause();
        },{capture: true, once: true});
      }
      mvImpl.strict = message.strict;
      maximizeVideo(elem);
      if(mvImpl.mainNode.tagName === 'VIDEO') {
        mvImpl.mainNode.focus({preventScroll:true});
      }
      chrome.runtime.sendMessage({action: 'popupWindow'});
    }
  }
  else if(message.action === 'getReadyStatus') {
    if(window === window.top) {
      if (document.readyState === 'complete' || document.readyState === 'interactive'){
        sendResponse({readyStatus: true});
      }
      else {
        sendResponse({readyStatus: false});
      }
    }
  }
  else if(message.action === 'setVideoMask') {
    if(window === window.top) {
      if(mvImpl.status === 'normal') {
        mvImpl.toolbarAction = message.toolbarAction;
        // console.log('setVideoMask');
        // console.log(new Date());
        removeVideoMask();
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          mvImpl.startScanTime = new Date();
          let cover = document.createElement('DIV');
          cover.classList.add('mvCover');
          cover.setAttribute('mvMaskHash', message.hashCode);
          document.body.appendChild(cover);
          let msg = {action: 'scanVideo', hashCode: message.hashCode};
          // if(message.supportFlash !== undefined) msg.supportFlash = message.supportFlash;
          if(message.minWidth !== undefined) msg.minWidth = message.minWidth;
          if(message.minHeight !== undefined) msg.minHeight = message.minHeight;
          chrome.runtime.sendMessage(msg);
        }
      }
      else if(mvImpl.status === 'selectVideo') {
        chrome.runtime.sendMessage({action: 'cancelSelectMode'});
      }
      else if(mvImpl.status === 'maximaVideo') {
        clearHideCursorTimer();
        chrome.runtime.sendMessage({action: 'cancelMaximaMode'});
      }
    }
  }
  else if(message.action === 'scanVideo') {
    if(window === window.top) {
      mvImpl.status = 'selectVideo';
      // console.log('scanVideo');
      let selector = 'video';
      let elements = document.querySelectorAll(selector);
      const _uploadElemInfo = () => {
        mvImpl.scanVideoTimer = null;
        if(mvImpl.status === 'selectVideo'){
          uploadElemInfo(elements, message.minWidth, message.minHeight );
          elements = document.querySelectorAll(selector);
          uploadElemInfo(elements, message.minWidth, message.minHeight, true);
          mvImpl.scanVideoTimer = setTimeout(_uploadElemInfo, 200);
        }
        if(window === window.top && mvImpl.toolbarAction === 1) {
          let diffTime = new Date() - mvImpl.startScanTime;
          if(diffTime > 3000) {
            mvImpl.toolbarAction = 0;
            chrome.runtime.sendMessage({action: 'cancelSelectMode'});
          }
        }
      }
      _uploadElemInfo();
    }
  }
  else if(message.action === 'cancelSelectMode') {
    mvImpl.status = 'normal';
    removeVideoMask();
  }
  else if(message.action === 'cancelMaximaMode') {
    mvImpl.status = 'normal';
    mvImpl.restoreCoreNode();
    restoreVideo();
  }
  return false;
});

if(window === window.top) {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    chrome.runtime.sendMessage({action: 'tabReady'});
  }
  else {
    window.addEventListener('DOMContentLoaded', event => {
      chrome.runtime.sendMessage({action: 'tabReady'});
    }, true);
  }
}

function initPrefs(cb){
  if(!init) {
    init = true;
    chrome.storage.local.get(results => {
      if ((typeof results.length === 'number') && (results.length > 0)) {
        results = results[0];
      }
      currentPrefs = results;
      cb();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if(area === 'local') {
        let changedItems = Object.keys(changes);
        for (let item of changedItems) {
          currentPrefs[item] = changes[item].newValue;
          switch (item) {
            case 'autoHideCursor':
            case 'delayForHideCursor':
              if(mvImpl.status === 'maximaVideo') {
                setHideCursorTimer();
              }
              break;
          }
        }
      }
    });
  }
  else {
    cb();
  }
}
