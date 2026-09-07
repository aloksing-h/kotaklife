// const dataMapKotakObj = {
//   CLASS_PREFIXES: ['block-item', 'block-subitem', 'block-subitem-finelsub'],

//   /**
//    * Recursively adds `comlist` + `{prefix}{1-based-index}` classes to each
//    * child element at the matching CLASS_PREFIXES depth level.
//    *
//    * @param {Element} parentElement
//    * @param {number} level - Current depth (default 0).
//    */
//   addIndexed(parentElement, level = 0) {
//     if (level >= this.CLASS_PREFIXES.length || !parentElement.children.length) return;

//     const prefix = this.CLASS_PREFIXES[level];
//     const { children } = parentElement;
//     for (let i = 0; i < children.length; i += 1) {
//       const child = children[i];
//       child.classList.add('comlist', `${prefix}${i + 1}`);
//       this.addIndexed(child, level + 1);
//     }
//   },

//   /**
//    * Recursively adds `{prefix}{parentBlockName}{1-based-index}` classes to
//    * each child element. The parent block name is derived from the second-to-last
//    * hyphen segment of the parent element's first class.
//    *
//    * @param {Element} parentElement
//    * @param {number} level - Current depth (default 0).
//    */
//   addIndexedTwo(parentElement, level = 0) {
//     if (level >= this.CLASS_PREFIXES.length || !parentElement.children.length) return;

//     const prefix = this.CLASS_PREFIXES[level];
//     const firstClass = parentElement.classList[0] ?? '';
//     const parClass = firstClass.split('-').at(-2) ?? '';
//     const { children } = parentElement;
//     for (let i = 0; i < children.length; i += 1) {
//       const child = children[i];
//       child.classList.add(`${prefix}${parClass}${i + 1}`);
//       this.addIndexedTwo(child, level + 1);
//     }
//   },
// };

// export default dataMapKotakObj;
