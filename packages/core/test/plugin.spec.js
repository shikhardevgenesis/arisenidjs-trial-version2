// import { assert } from 'chai';
// import 'mocha';
// import ArisenidJS from '../src/arisenid';
// import Arisen from 'arisenjs';
//
// const network = {
//     blockchain:'arisen',
//     protocol:'http',
//     host:'192.168.1.6',
//     port:8888,
//     chainId:'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f'
// };
//
// let arisenid, identity;
//
//
//
// describe('Plugin', () => {
//
//     it('should create a connection to Arisenid', done => {
//         new Promise(async() => {
//             ArisenidJS.arisenid.connect("Test Plugin").then(connected => {
//                 assert(connected, 'Not connected');
//                 arisenid = ArisenidJS.arisenid;
//                 done();
//             })
//         });
//     });
//
//     it('should forget an identity if existing', done => {
//         new Promise(async() => {
//             assert(await arisenid.forgetIdentity(), "Could not forget");
//             done();
//         });
//     });
//
//     it('should get an identity', done => {
//         new Promise(async() => {
//             assert(await arisenid.getIdentity({accounts:[network]}), "Could not get identity");
//             done();
//         });
//     });
//
//     it('should send a transaction with arisen proxy object', done => {
//         new Promise(async() => {
//             const arisen = arisenid.arisen(network, Arisen);
//             const transfer = await arisen.transfer('testacc', 'arisenio', '1.0000 ARISEN', '');
//             assert(transfer.hasOwnProperty('transaction_id'), "Couldn't sign transfer");
//             done();
//         });
//     });
//
// });