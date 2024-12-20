const { createResponse } = require("../../utils");
const { scanTableData } = require("../../service/dbservice");

const GetAllProductController = async (req, res) => {
  try {
    // Scan the WebScraperData table
    const products = await scanTableData("WebScraperData");

    // Parse the JSON string to convert it to an array of objects
    const parsedProducts = JSON.parse(products[0].products);

    // Transform the response to the desired format
    const formattedProducts = parsedProducts.map(product => ({
      id: product.id,
      title: product.title,
      weight: product.weight,
      price: product.price,
      productImages: product.productImages,
      productUrl: product.productUrl
    }));
console.log('formattedProducts',formattedProducts);

    // Return success response
    return res
      .status(200)
      .json(createResponse(200, "Products retrieved successfully", formattedProducts));
  } catch (error) {
    console.error("Error fetching products:", error);

    // Return error response
    return res
      .status(500)
      .json(createResponse(500, "Failed to fetch products", error.message));
  }
};



module.exports = GetAllProductController;
