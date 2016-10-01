const linkify = require('linkifyjs');
const url = require('url');

class Util {
  static format(str, args) {
    let ret = str;
    for (let i = 0; i < args.length; i += 1) {
      ret = ret.replace(`{${i}}`, args[i]);
    }
    return ret;
  }

  static numberToLetter(num) {
    let ret;
    let a;
    let b;
    for (ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) { // eslint-disable-line
      ret = String.fromCharCode(parseInt((num % b) / a, 10) + 65) + ret;
    }
    return ret;
  }

  static letterToNumber(val) {
    const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let i;
    let j;
    let result = 0;
    for (i = 0, j = val.length - 1; i < val.length; i += 1, j -= 1) {
      result += Math.pow(base.length, j) * (base.indexOf(val[i]) + 1);
    }
    return result;
  }

  static UTCTime() {
    return Math.floor(Date.now() / 1000);
  }

  static timeDiff(diff) {
    let text = '';

    if (diff <= 60) {
      text = `${diff} секунд`;
    } else {
      const minutes = Math.floor(diff / 60);
      if (minutes < 60) {
        text = `${minutes} минут`;
      } else {
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
          text = `${hours} часов`;
        } else {
          text = `${Math.floor(hours / 24)} дней`;
        }
      }
    }

    return text;
  }

  static sortByKey(array, key) {
    return array.sort((a, b) => {
      const x = a[key];
      const y = b[key];
      if (x < y) {
        return -1;
      } else if (x > y) {
        return 1;
      }
      return 0;
    });
  }

  static truncate(text, n, useWordBoundary) {
    const isTooLong = text.length > n;
    let s = isTooLong ? text.substr(0, n - 1) : text;
    s = (useWordBoundary && isTooLong) ? s.substr(0, s.lastIndexOf(' ')) : s;
    return isTooLong ? `${s}…` : s;
  }

  static cutLines(text, lineCount) {
    if (lineCount < 1) return text;
    const lines = text.split('\n');
    lines.splice(0, lineCount);
    return lines.join('\n');
  }

  static escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
  }

  static linkShortener(text) {
    let newText = Util.escapeHtml(text);
    const links = linkify.find(text, 'url');
    for (let i = 0; i < links.length; i += 1) {
      const link = links[0];
      newText = newText.replace(Util.escapeHtml(link.value), `<a href="${link.href}">${url.parse(link.href).host}...</a>`);
    }

    return newText;
  }
}

module.exports = Util;
