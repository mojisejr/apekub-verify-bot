require("dotenv").config({
  path: "config.env",
});

const PORT = process.env.PORT || 1234;
const channelId = "965495842557546526";
// const channelId = "965474646499663954";

const ethers = require("ethers");
const express = require("express");
const chalk = require("chalk");
const http = require("http");
const axios = require("axios");

const { getFormattedPrice } = require("./helper/priceFormatter");

const {
  bot,
  createPunkkubEmbedForListed,
  createPunkkubEmbedForSold,
} = require("./discord.bot");

const app = express();
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);

app.get("/alive", (req, res) => {
  res.status(200).json({
    result: "punk!",
  });
});

const BKCMainnetUrl = process.env.bitkubMainnet;
const BKCProvider = new ethers.providers.JsonRpcProvider(BKCMainnetUrl);

const megalandMarketPlace = new ethers.Contract(
  process.env.megalandMarketPlace,
  [
    "event ListingCreated(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price, uint256 createdAt, uint256 listingId)",
    "event ItemSold(address indexed buyer, address indexed nftContract, uint256 indexed tokenId, address seller, uint256 soldAt, uint256 listingId)",
    "function idToListing(uint256) view returns(uint256 listingId, address nftContract, uint256 tokenId, address exchangeToken, uint256 price, address seller, address buyer, uint256 createdAt, uint256 withdrawAt, uint256 soldAt, bool isKAP1155)",
  ],
  BKCProvider
);

const punkkub = new ethers.Contract(
  process.env.punkkub,
  ["function tokenURI(uint256 _tokenId) view returns(string memory)"],
  BKCProvider
);

const run = async () => {
  megalandMarketPlace.on(
    "ListingCreated",
    async (seller, nftContract, tokenId, price, createdAt, listingId) => {
      if (nftContract === process.env.punkkub) {
        console.log(chalk.yellowBright("[MarketPlace]: token listed."));

        const { price, exchangeToken } = await megalandMarketPlace.idToListing(
          listingId.toString()
        );

        const object = {
          seller,
          nftContract,
          tokenId: tokenId.toString(),
          price: getFormattedPrice(
            ethers.utils.formatEther(price.toString()).toString(),
            exchangeToken
          ),
          createdDate: new Date(createdAt.toString() * 1000).toLocaleDateString(
            "th-TH"
          ),
          createdTime: new Date(
            parseInt(createdAt.toString()) * 1000
          ).toLocaleTimeString("th-TH"),
        };

        console.log("KPUNK Listing detail: ", object);
        await sendListedToDiscord(object, bot);
      }
    }
  );
};

megalandMarketPlace.on(
  "ItemSold",
  async (buyer, nftContract, tokenId, seller, soldAt, listingId) => {
    if (nftContract === process.env.punkkub) {
      console.log(chalk.bgGreenBright("[MarketPlace]: token sold."));
      const { price, exchangeToken } = await megalandMarketPlace.idToListing(
        listingId.toString()
      );

      const object = {
        listingId: listingId.toString(),
        buyer,
        nftContract,
        tokenId: tokenId.toString(),
        price: getFormattedPrice(
          ethers.utils.formatEther(price.toString()).toString(),
          exchangeToken
        ),
        soldDate: new Date(
          parseInt(soldAt.toString()) * 1000
        ).toLocaleDateString("th-TH"),
        soldTime: new Date(
          parseInt(soldAt.toString()) * 1000
        ).toLocaleTimeString("th-TH"),
      };

      console.log("KPUNK selling detail: ", object);

      await sendSoldToDiscord(object, bot);
    }
  }
);

run();
startKeepAlive();

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(
    chalk.blueBright(
      "==== megaland - market tracker is now live ====",
      new Date().toDateString()
    )
  );
  console.log(
    chalk.blueBright(
      "==== system last updated: update exchange currency support ===="
    )
  );
});

async function sendListedToDiscord(object, bot) {
  const tokenURI = await punkkub.tokenURI(object.tokenId);
  const jsonObj = await axios.get(tokenURI);

  const embed = createPunkkubEmbedForListed(
    `${jsonObj.data.name} listed @${object.price}`,
    jsonObj.data.image,
    `listedAt: ${object.createdDate} | ${object.createdTime}`
  );

  const channel = bot.channels.cache.get(channelId);
  if (channel) {
    channel.send({
      embeds: [embed],
    });
  }
}

async function sendSoldToDiscord(object, bot) {
  const tokenURI = await punkkub.tokenURI(object.tokenId);
  const jsonObj = await axios.get(tokenURI);

  const embed = createPunkkubEmbedForSold(
    `${jsonObj.data.name} Sold @${object.price}`,
    jsonObj.data.image,
    `SoldAt: ${object.soldDate} | ${object.soldTime}`
  );

  const channel = bot.channels.cache.get(channelId);
  if (channel) {
    channel.send({
      embeds: [embed],
    });
  }
}

function startKeepAlive() {
  setInterval(function () {
    let options = {
      host: "https://punkkub-discord-bot.herokuapp.com",
      port: 80,
      path: "/alive",
    };
    http.get(options, function (res) {
      res.on("data", function (chunk) {
        console.log("punk! the punk!");
      });
      res.on("error", function (error) {
        console.log(error.message);
      });
    });
  }, 30 * 60 * 1000);
}
