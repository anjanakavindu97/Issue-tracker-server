const mongoose = require('mongoose');
import config from './config';
import logger from '../utils/logger';

export default async function databaseSetup() {
    try {
        await mongoose.connect(config.mongodbUri);
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('Error connecting to MongoDB', error);
        process.exit(1);
    }
}