let mvTabs = [];
let resetTabs = [];
let selectedVideo = null;

let defaultPreference = {
  popupWindow: false,
  toolbarAction: 0,
  supportFlash: true,
  minWidth: 100,
  minHeight: 100,
  autoHideCursor: false,
  delayForHideCursor: 6,
  // iconColor: 0,
  version: 4
};
let preferences = {};

function getHashCode() {
  let hashCode = '';
  let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let max = characters.length;
  for(let i = 0; i < 32; ++i) {
      let r = Math.floor((Math.random() * (i === 0 ? 52 : 62) )); //don't start with number
      //let r = Math.floor(Math.random() * max);
      let char = characters.charAt(r);
      hashCode += char;
  }
  return hashCode;
}

const storageChangeHandler = (changes, area) => {
  if(area === 'local') {
    let changedItems = Object.keys(changes);
    for (let item of changedItems) {
      preferences[item] = changes[item].newValue;
      switch (item) {
        // case 'iconColor':
        //   setBrowserActionIcon();
        //   break;
      }
    }
  }
};

const loadPreference = () => {
  chrome.storage.local.get(results => {
    if ((typeof results.length === 'number') && (results.length > 0)) {
      results = results[0];
    }
    if (!results.version) {
      preferences = defaultPreference;
      chrome.storage.local.set(defaultPreference, res => {
        chrome.storage.onChanged.addListener(storageChangeHandler);
      });
    } else {
      preferences = results;
      chrome.storage.onChanged.addListener(storageChangeHandler);
    }
    if (preferences.version !== defaultPreference.version) {
      let update = {};
      let needUpdate = false;
      for(let p in defaultPreference) {
        if(preferences[p] === undefined) {
          update[p] = defaultPreference[p];
          needUpdate = true;
        }
      }
      if(needUpdate) {
        chrome.storage.local.set(update);
      }
    }
    //setBrowserActionIcon();
  });
};

// const setBrowserActionIcon = () => {
//   if(preferences.iconColor === 1) {
//     chrome.browserAction.setIcon({path: 'icon/icon_w.png'});
//   } else {
//     chrome.browserAction.setIcon({path: 'icon/icon_b.png'});
//   }
// };

window.addEventListener('DOMContentLoaded', event => {
  loadPreference();
});

chrome.browserAction.disable();
chrome.browserAction.onClicked.addListener(tab => {
  let hashCode = getHashCode();
  chrome.tabs.sendMessage(tab.id, {
    action: 'setVideoMask',
    toolbarAction: preferences.toolbarAction,
    hashCode: hashCode
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
  try{
    chrome.tabs.sendMessage(tabId, {
      action: 'getReadyStatus'
    }, response => {
      if(response){
        if(response.readyStatus) {
          chrome.browserAction.enable(tabId);
        }
        else {
          chrome.browserAction.disable(tabId);
        }
      }
    });
  } catch(ex){}
});

chrome.tabs.query({}, tabs => {
  for(let tab of tabs) {
    if(tab.status === 'loading') {
      try {
        chrome.tabs.sendMessage(tab.id, {
          action: 'getReadyStatus'
        }, response => {
          if(response && response.readyStatus === true) {
            chrome.browserAction.enable(tab.id);
          }
        });
      } catch(ex) {}
    }
    else { //complete
      chrome.browserAction.enable(tab.id);
    }
  }
});

const messageHandler = (message, sender, sendResponse) => {
  // console.log(message);
  if(message.action === 'tabReady'){
    chrome.browserAction.enable(sender.tab.id);
  }
  else if(message.action === 'popupWindow'){
    if(preferences.popupWindow) {
      chrome.runtime.sendMessage('nnlippelgfbglbhiccffmnmlnhmbjjpe',
      {
        action: 'popupWindow',
        tabId: sender.tab.id
      });
    }
  }
  else if(message.action === 'scanVideo'){
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'scanVideo',
      hashCode: message.hashCode,
      supportFlash: message.supportFlash !== undefined ? message.supportFlash : preferences.supportFlash,
      minWidth: message.minWidth !== undefined ? message.minWidth : preferences.minWidth,
      minHeight: message.minHeight !== undefined ? message.minHeight : preferences.minHeight
    });
  }
  else if(message.action === 'cancelSelectMode'){
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'cancelSelectMode'
    });
  }
  else if(message.action === 'maximizeVideo'){
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'maximizeVideo',
      hashCode: message.hashCode,
      strict: message.strict
    });
  }
  else if(message.action === 'cancelMaximaMode'){
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'cancelMaximaMode'
    });
  }
  //return true;
};

const externalMessageHandler = (message, sender, sendResponse) => {

  // chrome.runtime.sendMessage('MaximizeVideo@ettoolong',{
  //   action: 'maximizeVideo',
  //   autoSelect: true,
  //   supportFlash: true,
  //   minWidth: 100,
  //   minHeight: 100,
  //   tabId: 0
  // });

  if(message.action === 'maximizeVideo' && message.tabId !== undefined) {
    let toolbarAction = preferences.toolbarAction;
    let supportFlash = preferences.supportFlash;
    let minWidth = preferences.minWidth;
    let minHeight = preferences.minHeight;
    let hashCode = getHashCode();
    if(message.autoSelect !== undefined) {
      toolbarAction = message.autoSelect === true ? 1 : 0;
    }

    chrome.tabs.sendMessage(message.tabId, {
      action: 'setVideoMask',
      toolbarAction: toolbarAction,
      hashCode: hashCode,
      supportFlash: message.supportFlash !== undefined ? message.supportFlash : preferences.supportFlash,
      minWidth: message.minWidth !== undefined ? message.minWidth : preferences.minWidth,
      minHeight: message.minHeight !== undefined ? message.minHeight : preferences.minHeight
    });
  }
};

chrome.runtime.onMessage.addListener(messageHandler);
chrome.runtime.onMessageExternal.addListener(externalMessageHandler);
