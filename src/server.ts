import 'dotenv/config';
import env from './UTILITIES/environment';
import index from './index';

index.listen(env.PORT);