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
		try {
			this.client = await MongoClient.connect(this.path, {});
			this.db = this.client.db(this.dbName);
		} catch (err) {
			console.error(new Error(err));
		}
	}

	async disconnect() {
		try {
			await this.client.close();
		} catch (err) {
			console.error(new Error(err));
		}
	}

	async insertIntoCollection(collection, data) {
		let err;
		await this.db.collection(collection).insertOne(data).catch(e => {
			console.log(e);
			console.log(`Couldn't insert`)
			err = false;
		});
		return err ? err : true;
	}

	async updateInCollection(collection, key, data, many = false) {
		let err;
		if (many) 
			await this.db.collection(collection).updateMany(key, {$set: data});
		else
			await this.db.collection(collection).updateOne(key, {$set: data});
		return err ? err : true;
	}

	async updatePushToCollection(collection, key, arrayName, data) {
		let err,
			array = {};
		array[arrayName] = data;
		await this.db.collection(collection).updateMany(key, {$push: array});
		return err ? err : true;
	}


	async deleteFromCollection(collection, query) {
		let err;
		await this.db.collection(collection).deleteMany(query).catch(e => {
			console.log(e);
			console.log(`Couldn't delete`)
			err = false;
		});
		return err ? err : true;
	}

	async findInCollection(collection, key) {
		const cursor = this.db.collection(collection).find(key);
		var ret = [];
		for (let item = await cursor.next(); item != null; item = await cursor.next()) {
			ret.push(item);
		}
		return ret;	
	}

	async findProjectInCollection(collection, key, projection) {
		const cursor = this.db.collection(collection).find(key).project(projection);
		var ret = [];
		for (let item = await cursor.next(); item != null; item = await cursor.next()) {
			ret.push(item);
		}
		return ret;	
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