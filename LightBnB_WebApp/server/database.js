const { Pool } = require("pg");

const pool = new Pool({
  user: "labber",
  password: "123",
  host: "localhost",
  database: "lightbnb",
});

const properties = require("./json/properties.json");
const users = require("./json/users.json");

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const queryString = `
  SELECT * FROM users 
  WHERE email = $1
  `;

  const params = [email.toLowerCase()];

  return pool
    .query(queryString, params)
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

// PRIOR TO REFACTORING -- STUDY PURPOSES
//   let user;
//   for (const userId in users) {
//     user = users[userId];
//     if (user.email.toLowerCase() === email.toLowerCase()) {
//       break;
//     } else {
//       user = null;
//     }
//   }
//   return Promise.resolve(user);
// };

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const queryString = `
  SELECT * FROM users
  WHERE id = $1
  `;

  const params = [id];

  return pool
    .query(queryString, params)
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

// PRIOR TO REFACTORING -- STUDY PURPOSES
// return Promise.resolve(users[id]);

exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const queryString = `
  INSERT INTO users(name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *;
  `;

  const params = [user.name, user.email, user.password];

  return pool
    .query(queryString, params)
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

// PRIOR TO REFACTORING -- STUDY PURPOSES
//   const userId = Object.keys(users).length + 1;
//   user.id = userId;
//   users[userId] = user;
//   return Promise.resolve(user);
// };

exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(
      `SELECT * 
  FROM reservations
  JOIN users ON users.id = guest_id
  JOIN properties ON properties.id = property_id
  WHERE guest_id = $1
  LIMIT $2;`,
      [`${guest_id}`, `${limit}`]
    )
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

// PRIOR TO REFACTORING -- STUDY PURPOSES
// return getAllProperties(null, 2);

exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    const operator = queryParams.length > 0 ? "AND" : "WHERE";
    queryParams.push(options.owner_id);
    queryString += `${operator} owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    const operator = queryParams.length > 0 ? "AND" : "WHERE";
    queryParams.push(
      options.minimum_price_per_night * 100,
      options.maximum_price_per_night * 100
    );
    queryString += `${operator} cost_per_night >= $${
      queryParams.length - 1
    } AND cost_per_night <= $${queryParams.length} `;
  }

  if (options.minimum_rating) {
    const operator = queryParams.length > 0 ? "AND" : "WHERE";
    queryParams.push(options.minimum_rating);
    queryString += `${operator} rating >= $${queryParams.length} `;
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5 -- CONSOLE LOG REMOVED

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
};

// PRIOR TO REFACTORING -- STUDY PURPOSES
//   const limitedProperties = {};
//   for (let i = 1; i <= limit; i++) {
//     limitedProperties[i] = properties[i];
//   }
//   return Promise.resolve(limitedProperties);
// };

exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  return pool
    .query(
      `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;`,
      [
        property.owner_id,
        `${property.title}`,
        `${property.description}`,
        `${property.thumbnail_photo_url}`,
        `${property.cover_photo_url}`,
        property.cost_per_night,
        `${property.street}`,
        `${property.city}`,
        `${property.province}`,
        `${property.post_code}`,
        `${property.country}`,
        property.parking_spaces,
        property.number_of_bathrooms,
        property.number_of_bedrooms,
      ]
    )
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log(err.message);
    });
};

// PRIOR TO REFACTORING -- STUDY PURPOSES
// const propertyId = Object.keys(properties).length + 1;
// property.id = propertyId;
// properties[propertyId] = property;
// return Promise.resolve(property);

exports.addProperty = addProperty;
