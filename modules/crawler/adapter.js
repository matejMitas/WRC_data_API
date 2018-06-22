const MongoClient = require('mongodb').MongoClient;

var mongoErrorCodes = {
	error_26: 'Non existent collection'
}

module.exports = class Adapter {
	constructor(path, dbName) {
		this.path = path;
		this.dbName = dbName;
	}

	async connect() {
		this.client = await MongoClient.connect(this.path).catch(e => {console.log('Couldn\'t connect')});
		if (this.client)
			this.db = this.client.db(this.dbName);
		else
			return false;
		return true;
	}

	async disconnect() {
		await this.client.close();
	}

	async insertIntoCollection(collection, data) {
		let err;
		await this.db.collection(collection).insertOne(data).catch(e => {
			console.log('Couldn\'t insert')
			err = false;
		});
		return err ? err : true;
	}

	async updateInCollection(collection, key, data, many) {
		let err;
		if (many) 
			await this.db.collection(collection).updateMany(key, {$set: data});
		else
			await this.db.collection(collection).updateOne(key, {$set: data});
		return err ? err : true;
	}

	async deleteFromCollection(collection, key, data, many) {

	}

	async dropCollection(collection) {
		let err;
		await this.db.collection(collection).drop().catch(e => {
			console.log(mongoErrorCodes[`error_${e.code}`]);
			err = false;
		});
		return err ? err : true;
	}
}