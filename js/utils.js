export function getHashCode() {
  let hashCode = '';
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  // let max = characters.length;
  for(let i = 0; i < 32; ++i) {
      const r = Math.floor((Math.random() * (i === 0 ? 52 : 62) )); //don't start with number
      //let r = Math.floor(Math.random() * max);
      const char = characters.charAt(r);
      hashCode += char;
  }
  return hashCode;
}
