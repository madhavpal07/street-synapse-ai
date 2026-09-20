import test from 'node:test';
import assert from 'node:assert/strict';
import {matchingRoutes,distanceKm,routes} from '../lib/routes.js';
test('stop filtering respects travel direction and rejects identical/unknown stops',()=>{
 assert.equal(matchingRoutes('quantum','railway').length,1);
 for(const [a,b] of [['railway','quantum'],['civil','civil'],['bad','railway']])assert.equal(matchingRoutes(a,b).length,0);
 assert.deepEqual(routes[0].busIds,['BUS-001','BUS-002']);
});
test('straight-line distance is zero at the same point and about 111 km for one latitude degree',()=>{
 assert.equal(distanceKm({latitude:0,longitude:0},{latitude:0,longitude:0}),0);
 assert.ok(Math.abs(distanceKm({latitude:0,longitude:0},{latitude:1,longitude:0})-111.195)<.01);
});
