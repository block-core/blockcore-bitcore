'use strict';

var Message = require('../message');
var inherits = require('util').inherits;
var bitcore = require('bitcore-lib-city');
var utils = require('../utils');
var BufferReader = bitcore.encoding.BufferReader;
var BufferWriter = bitcore.encoding.BufferWriter;
var _ = bitcore.deps._;
var $ = bitcore.util.preconditions;

/**
 * Sent in response to a `getheaders` message. It contains information about
 * block headers.
 * @param {Array} arg - An array of BlockHeader instances
 * @param {Object=} options
 * @param {Array=} options.headers - array of block headers
 * @param {Function} options.BlockHeader - a BlockHeader constructor
 * @extends Message
 * @constructor
 */
function HeadersMessage(arg, options) {
  Message.call(this, options);
  this.BlockHeader = options.BlockHeader;
  this.command = 'headers';
  $.checkArgument(
    _.isUndefined(arg) || (Array.isArray(arg) && arg[0] instanceof this.BlockHeader),
    'First argument is expected to be an array of BlockHeader instances'
  );
  this.headers = arg;
}
inherits(HeadersMessage, Message);

HeadersMessage.prototype.setPayload = function(payload) {

  console.log('HEADERS SET PAYLOAD!');
  console.log(payload);

  $.checkArgument(payload && payload.length > 0, 'No data found to create Headers message');
  var parser = new BufferReader(payload);
  var count = parser.readVarintNum();

  console.log('PAYLOAD COUNT: ' + count);

  this.headers = [];
  for (var i = 0; i < count; i++) {

    var header = this.BlockHeader.fromBufferReader(parser);

    // console.log('Header (' + i + ') - ' + header.length + ': ' + header);
    // console.log(JSON.stringify(header));

    this.headers.push(header);

    // var txn_count = parser.readUInt8();
    // console.log('txn_count:' + txn_count);
    // $.checkState(txn_count === 0, 'txn_count should always be 0');

  }

  console.log('Check Finished...');

  utils.checkFinished(parser);
};

HeadersMessage.prototype.getPayload = function() {

  var bw = new BufferWriter();
  bw.writeVarintNum(this.headers.length);
  for (var i = 0; i < this.headers.length; i++) {
    var buffer = this.headers[i].toBuffer();
    bw.write(buffer);
    bw.writeUInt8(0);
  }
  return bw.concat();
};

module.exports = HeadersMessage;
