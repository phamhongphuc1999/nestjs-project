import { PostgresDataSource } from 'src/databases';

PostgresDataSource.initialize()
  .then(() => console.log('DB connected'))
  .catch((err) => console.error(err));
