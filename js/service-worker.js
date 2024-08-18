import { getHashCode } from '/js/utils.js';

const setBrowserActionIcon = () => {
  chrome.storage.session.get(['iconColor'], preferences => {
    if(preferences.iconColor === 1) {
      chrome.action.setIcon({path: '/icon/icon_w.png'});
    }
    else {
      chrome.action.setIcon({path: '/icon/icon_b.png'});
    }
  })
};

chrome.action.disable();
chrome.storage.local.get(results => {
  let defaultPreference = {
    popupWindow: false,
    toolbarAction: 0,
    // supportFlash: true,
    minWidth: 100,
    minHeight: 100,
    autoHideCursor: false,
    delayForHideCursor: 6,
    iconColor: 0,
    youtubeControllers: false,
    version: 7
  };
  if ((typeof results.length === 'number') && (results.length > 0)) {
    results = results[0];
  }
  if (results.version) {
    if (results.version !== defaultPreference.version) {
      const update = {};
      let needUpdate = false;
      for(const p in defaultPreference) {
        if(results[p] === undefined) {
          update[p] = defaultPreference[p];
          needUpdate = true;
        }
      }
      if(needUpdate) {
        chrome.storage.local.set(update);
      }
    }
    chrome.storage.session.set(results, _ => {
      setBrowserActionIcon();
    })
  } else {
    // initial storage data
    chrome.storage.local.set(defaultPreference, _ => {});
    chrome.storage.session.set(defaultPreference, _ => {
      setBrowserActionIcon();
    })
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if(area === 'local') {
    const updateValues = Object.keys(changes).reduce((acc, cur) => {
      acc[cur] = changes[cur].newValue;
      return acc;
    }, {}) ;
    chrome.storage.session.set(updateValues, _ => {
      if (changes.iconColor) {
        setBrowserActionIcon();
      }
    })
  }
});

chrome.action.onClicked.addListener(tab => {
  chrome.storage.session.get(['toolbarAction'], preferences => {
    const hashCode = getHashCode();
    chrome.tabs.sendMessage(tab.id, {
      action: 'setVideoMask',
      toolbarAction: preferences.toolbarAction,
      hashCode: hashCode
    }).catch(ex => {
      console.log(ex)
    });
  })
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
  try{
    chrome.tabs.sendMessage(tabId, {
      action: 'getReadyStatus'
    }).then((response) => {
      if(response){
        if(response.readyStatus) {
          chrome.action.enable(tabId);
        }
        else {
          chrome.action.disable(tabId);
        }
      }
    }).catch((ex) => {
    })
  } catch(ex){
  }
});

chrome.tabs.query({}, tabs => {
  for(const tab of tabs) {
    if(tab.status === 'loading') {
      try {
        chrome.tabs.sendMessage(tab.id, {
          action: 'getReadyStatus'
        }).then(response => {
          if(response && response.readyStatus === true) {
            chrome.action.enable(tab.id);
          }
        }).catch((ex) => {
        });
      } catch(ex) {}
    }
    else { //complete
      chrome.action.enable(tab.id);
    }
  }
});

chrome.commands.onCommand.addListener(command => {
  if (command === "maximizeVideo") {
    chrome.storage.session.get(['toolbarAction'], preferences => {
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if ((typeof tabs !== 'undefined') && (tabs.length > 0)) {
          const tab = tabs[0];
          const hashCode = getHashCode();
          chrome.tabs.sendMessage(tab.id, {
            action: 'setVideoMask',
            toolbarAction: preferences.toolbarAction,
            hashCode: hashCode
          });
        }
        else {
        }
      });
    })
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log(message);
  if(message.action === 'tabReady'){
    chrome.action.enable(sender.tab.id);
  }
  else if(message.action === 'popupWindow') {
    chrome.storage.session.get(['popupWindow'], preferences => {
      if(preferences.popupWindow) {
        chrome.runtime.sendMessage('nnlippelgfbglbhiccffmnmlnhmbjjpe',
        {
          action: 'popupWindow',
          tabId: sender.tab.id
        });
      }
    })
  }
  else if(message.action === 'scanVideo'){
    chrome.storage.session.get(['minWidth', 'minHeight'], preferences => {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: 'scanVideo',
        hashCode: message.hashCode,
        // supportFlash: message.supportFlash !== undefined ? message.supportFlash : preferences.supportFlash,
        minWidth: message.minWidth !== undefined ? message.minWidth : preferences.minWidth,
        minHeight: message.minHeight !== undefined ? message.minHeight : preferences.minHeight
      });
    })
  }
  else if(message.action === 'cancelSelectMode'){
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'cancelSelectMode'
    });
  }
  else if(message.action === 'maximizeVideo'){
    chrome.storage.session.get(['youtubeControllers'], preferences => {
      const exec = ({youtubeControllers}) => {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'maximizeVideo',
          hashCode: message.hashCode,
          strict: message.strict,
          youtubeControllers
        });
      }

      if (preferences.youtubeControllers && sender.tab.url.startsWith('https://www.youtube.com/watch')) {
        exec({youtubeControllers: true})
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'maximizeVideo-ytb',
        });
      } else {
        exec({youtubeControllers: false})
      }
    })
  }
  else if(message.action === 'cancelMaximaMode'){
    chrome.storage.session.get(['youtubeControllers'], preferences => {
      const exec = ({youtubeControllers}) => {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'cancelMaximaMode',
          youtubeControllers
        });
      }

      if (preferences.youtubeControllers && sender.tab.url.startsWith('https://www.youtube.com/watch')) {
        exec({youtubeControllers: true})
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'cancelMaximaMode-ytb',
        });
      } else {
        exec({youtubeControllers: false})
      }
    })
  }
  else if(message.action === 'videoHotkey'){
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'videoHotkey',
      keyCode: message.keyCode,
      shiftKey: message.shiftKey,
      ctrlKey: message.ctrlKey
    });
  }
  else if(message.action.startsWith('mi_')){
    chrome.tabs.sendMessage(sender.tab.id, {
      ...message
    })
  }
  //return true;
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  chrome.storage.session.get(['toolbarAction', 'minWidth', 'minHeight'], preferences => {
    if(message.action === 'maximizeVideo' && message.tabId !== undefined) {
      const hashCode = getHashCode();
      if(message.autoSelect !== undefined) {
        toolbarAction = message.autoSelect === true ? 1 : 0;
      }

      chrome.tabs.sendMessage(message.tabId, {
        action: 'setVideoMask',
        toolbarAction: preferences.toolbarAction,
        hashCode: hashCode,
        // supportFlash: message.supportFlash !== undefined ? message.supportFlash : preferences.supportFlash,
        minWidth: message.minWidth !== undefined ? message.minWidth : preferences.minWidth,
        minHeight: message.minHeight !== undefined ? message.minHeight : preferences.minHeight
      });
    }
  })
});
