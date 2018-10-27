let currentPrefs = {};

const saveToPreference = (id, value) => {
  let update = {};
  update[id] = value;
  chrome.storage.local.set(update);
};

const checkCommand = (id, cb) => {
  let modifier = document.querySelector('select[group='+id+'][type=modifier]');
  let modifier2 = document.querySelector('select[group='+id+'][type=modifier2]');
  let key = document.querySelector('select[group='+id+'][type=key]');
  [modifier, modifier2, key].forEach(item => item.classList.remove('invalid'));

  switch (true) {
    case !key.value && !modifier.value && !modifier2.value:
      cb({update:true, message:'disableHotkey'});
      break;

    case !key.value && !!(modifier.value || modifier2.value):
      key.classList.add('invalid');
      cb({update:false, message:'invalidSetting'});
      break;

    case !modifier.value && !/^F[1-9][0-2]?$/.test(key.value): // must have modiefer unless function key
      modifier.classList.add('invalid');
      cb({update:false, message:'invalidSetting'});
      break;

    default:
      cb({update:true, message:''});
  }
}

const handleVelueChange = id => {
  let elem = document.getElementById(id);
  if(elem) {
    let elemType = elem.getAttribute('type');
    if(elemType === 'checkbox') {
      elem.addEventListener('input', event => {
        saveToPreference(id, elem.checked ? true : false);
      });
    }
    else if(elemType === 'number') {
      elem.addEventListener('input', event => {
        saveToPreference(id, parseInt(elem.value));
      });
    }
    else if(elemType === 'option') {
      elem.addEventListener('input', event => {
        saveToPreference(id, parseInt(elem.value));
      });
    }
    else if(elemType === 'command') {
      for(let selectName of ['modifier', 'modifier2', 'key']) {
        let select = document.querySelector('select[group='+id+'][type='+selectName+']');
        select.addEventListener('input', event => {
          let label = document.querySelector('label[group='+id+']');
          label.classList.add('hide');
          label.classList.remove('error');
          checkCommand( id, result => {
            if(result.update) {
              let keys = [];
              for(let selectName2 of ['modifier', 'modifier2', 'key']) {
                let select2 = document.querySelector('select[group='+id+'][type='+selectName2+']');
                keys.push(select2.value);
              }
              saveToPreference(id, keys.join('+'));
            }
            else {
              label.classList.add('error');
            }
            if(result.message !== '') {
              label.textContent = chrome.i18n.getMessage(result.message);
              label.classList.remove('hide');
            }
          });
        });
      }
    }
    else if(elemType === 'radioGroup') {
      let radios = Array.from(elem.querySelectorAll('input[name='+id+']'));
      for(let radio of radios) {
        radio.addEventListener('input', event => {
          if(radio.checked)
            saveToPreference(id, parseInt(radio.getAttribute('value')));
        });
      }
    }
  }
};

const setValueToElem = (id, value) => {
  let elem = document.getElementById(id);
  if(elem) {
    let elemType = elem.getAttribute('type');
    if(elemType === 'checkbox') {
      elem.checked = value;
    }
    if(elemType === 'number') {
      elem.value = value;
    }
    else if(elemType === 'option') {
      let options = Array.from(elem.querySelectorAll('option'));
      for(let option of options) {
        if(parseInt(option.getAttribute('value')) === value) {
          option.selected = true;
          break;
        }
      }
    }
    else if(elemType === 'command') {
      let keys = value.split('+');
      if(keys.length !== 3) keys = ['','',''];
      let cmd = { modifier: keys[0], modifier2: keys[1], key: keys[2] };
      for(let selectName of ['modifier', 'modifier2', 'key']) {
        let select = document.querySelector('select[group='+id+'][type='+selectName+']');
        let options = Array.from(select.querySelectorAll('option'));
        for(let option of options) {
          if(option.getAttribute('value') === cmd[selectName]) {
            option.selected = true;
            break;
          }
        }
      }
    }
    else if(elemType === 'radioGroup') {
      let radios = Array.from(elem.querySelectorAll('input[name='+id+']'));
      for(let radio of radios) {
        if(parseInt(radio.getAttribute('value')) === value) {
          radio.checked = true;
          break;
        }
      }
    }
  }
};

const createCommandElem = (os) => {
  let modifier = os === 'mac' ?
      [{value:'', text:''},{value:'MacCtrl', text:'Ctrl'}, {value:'Alt', text:'Option'}, {value:'Ctrl', text:'Command'}] :
      [{value:'', text:''}, {value:'Ctrl', text:'Ctrl'}, {value:'Alt', text:'Alt'}];
  let modifier2 = ['', 'Shift'];
  let key = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
      'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
      'Comma', 'Period', 'Home', 'End', 'PageUp', 'PageDown', 'Space',
      'Insert', 'Delete', 'Up', 'Down', 'Left', 'Right'];
  let commandModifier = document.querySelector('select[group=shortcut][type=modifier]');
  let commandModifier2 = document.querySelector('select[group=shortcut][type=modifier2]');
  let commandKey = document.querySelector('select[group=shortcut][type=key]');

  for(let k of modifier) {
    let elem = document.createElement("option");
    elem.setAttribute('value', k.value);
    elem.textContent = k.text;
    commandModifier.appendChild(elem);
  }
  for(let k of modifier2) {
    let elem = document.createElement("option");
    elem.setAttribute('value', k);
    elem.textContent = k;
    commandModifier2.appendChild(elem);
  }
  for(let k of key) {
    let elem = document.createElement("option");
    elem.setAttribute('value', k);
    elem.textContent = k;
    commandKey.appendChild(elem);
  }
}

const init = preferences => {
  currentPrefs = preferences;
  for(let p in preferences) {
    setValueToElem(p, preferences[p]);
    handleVelueChange(p);
  }
  let l10nTags = Array.from(document.querySelectorAll('[data-l10n-id]'));
  l10nTags.forEach(tag => {
    tag.textContent = chrome.i18n.getMessage(tag.getAttribute('data-l10n-id'));
  });
};

window.addEventListener('load', event => {
  browser.runtime.getPlatformInfo().then(info => {
    createCommandElem(info.os);
  });
  chrome.storage.local.get(results => {
    if ((typeof results.length === 'number') && (results.length > 0)) {
      results = results[0];
    }
    if (results.version) {
      init(results);
    }
  });
}, true);
