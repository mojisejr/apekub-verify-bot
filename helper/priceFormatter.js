const lumi = "0x95013Dcb6A561e6C003AED9C43Fb8B64008aA361";
const kkub = "0x67eBD850304c70d983B2d1b93ea79c7CD6c3F6b5";
const kbtc = "0x83Bc235Ff023E5781389ef2CE7C456b330757918";
const kusdt = "0x7d984C24d2499D840eB3b7016077164e15E5faA6";
const kusdc = "0x77071ad51ca93fc90e77BCdECE5aa6F1B40fcb21";
const fans = "0x9C04EFD1E9aD51A605eeDcb576159242FF930368";
const yes = "0x8debbb77e8a17cffCfC0C7F1f40308886edD3f9f";

function getFormattedPrice(price, tokenAddress) {
  console.log("token address", tokenAddress);
  switch (tokenAddress) {
    case kkub: {
      return `${price} KUB`;
      break;
    }
    case lumi: {
      return `${price} LUMI`;
      break;
    }
    case kbtc: {
      return `${price} KBTC`;
      break;
    }
    case kusdt: {
      return `${price} KUSDT`;
      break;
    }
    case kusdc: {
      return `${price} KUSDC`;
      break;
    }
    case fans: {
      return `${price} FANS`;
      break;
    }
    case yes: {
      return `${price} yesToken`;
      break;
    }
    default:
      return `${price} KUB(default)`;
  }
}

module.exports = {
  getFormattedPrice,
};
