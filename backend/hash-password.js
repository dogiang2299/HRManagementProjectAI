const bcrypt = require('bcrypt');

bcrypt.hash('111111', 10).then((hash) => {
  console.log(hash);
});

// $2b$10$pNoWfCCIBga5ZPX2jl/VsevVzRR/oM6K2B8Bl9CeqI4jfvCUXlfgO