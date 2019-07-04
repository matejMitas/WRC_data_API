const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

var mongoErrorCodes = {
	error_26: 'Non existent collection'
}

class Adapter {
	constructor(path, dbName) {
		this.path = path;
		this.dbName = dbName;
	}

	async connect() {
		this.client = await MongoClient.connect(this.path).catch(e => {console.log('Couldn\'t connect')});
		if (this.client)
			this.db = this.client.db(dbName);
		else
			return false;
		return true;
	}

	async disconnect() {
		await this.client.close();
	}

	async insertIntoCollection(collection, data) {

		let len = data.length,
			err;
		// distinguish between object and array
		// futhermore, if array, decide on number added elems
		if (len !== undefined) {
			await this.db.collection(collection).insertMany(data).catch(e => {
				console.log('Couldn\'t insert')
				err = false;
			});
		} else {
			await this.db.collection(collection).insertOne(data).catch(e => {
				console.log('Couldn\'t insert')
				err = false;
			});
		}		
		return err ? err : true;
	}

	async deleteFromCollection(collection, data) {

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

/*(async function sim() {
	var adp = new Adapter('mongodb://localhost:2017', 'api');
	await adp.connect();
	await adp.dropCollection('Movies');
	await adp.insertIntoCollection('Movies', {test: 'ß'});
	await adp.disconnect();
})();*/






// Connection URL
const url = 'mongodb://localhost:2017';
// Database Name
const dbName = 'api';

test();

async function test() {

  	const client = await MongoClient.connect(url).catch(e => {console.log('pripojeni')});;
 // 	const db = await client.db(dbName);

 // 	// Get the updates collection
 //    const col = db.collection('Rallies');
	// await col.drop().catch(e => {console.log(mongoErrorCodes[`error_${e.code}`])});
	
	// var r;

	// r = await col.insertOne({a:1, d: new Date()});
	// console.log(r.insertedCount);
	// r = await col.updateOne({a:1}, {$set: {a: 4}});
	// console.log(r.matchedCount);
	// console.log(r.modifiedCount);
	// r = await col.deleteOne({a:4});
	// console.log(r.deletedCount);

	// //Don't `await`, instead get a cursor
	// const cursor = col.find();
	// var arr = [];
	// // Use `next()` and `await` to exhaust the cursor
	// for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
	// 	arr.push(doc);
	// }
	// console.log(arr);


	await client.close();
}





