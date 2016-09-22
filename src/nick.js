const alphabetG = 'аоиеёэыуюя'.split('');
const alphabetS = 'бвгджзклмнпрстфхцчшщ'.split('');

class Nickname {
  static generate(syllableCount) {
    if (!syllableCount || syllableCount < 1) return;
    function random(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
    let output = '';
    for (let i = 0; i < syllableCount; ++i) {
      output += alphabetS[random(0, alphabetS.length - 1)];
      output += alphabetG[random(0, alphabetG.length - 1)];
    }
    
    output = output.charAt(0).toUpperCase() + output.slice(1);
    return output;
  }
}

module.exports = Nickname;
