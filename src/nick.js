const alphabetG = 'аоиеёэыуюя'.split('');
const alphabetS = 'бвгджзклмнпрстфхцчшщ'.split('');

class Nickname {
  static generate(syllableCount) {
    if (!syllableCount || syllableCount < 1) return;

    let output = '';
    for (let i = 0; i < syllableCount; i += 1) {
      output += alphabetS[Nickname.random(0, alphabetS.length - 1)];
      output += alphabetG[Nickname.random(0, alphabetG.length - 1)];
    }

    const nick = output.charAt(0).toUpperCase() + output.slice(1);

    return nick; // eslint-disable-line
  }

  static $random(min, max) {
    return Math.floor((Math.random() * ((max - min) + 1)) + min);
  }
}

module.exports = Nickname;
