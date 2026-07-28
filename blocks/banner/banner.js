import dataMapKotakObj from '../../scripts/constant.js';

export default async function decorate(block) {
  if (dataMapKotakObj?.addIndexed) {
    dataMapKotakObj.CLASS_PREFIXES = [
      'banner-cont',
      'banner-sec',
      'banner-sub',
      'banner-inner-text',
      'banner-list',
      'banner-list-content',
    ];
    dataMapKotakObj.addIndexed(block);
  }
}
