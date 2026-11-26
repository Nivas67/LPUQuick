'use strict';

const { StringDecoder } = require('node:string_decoder');

const NORMALIZED_ENCODINGS = new Map([
    ['utf8', 'utf8'],
    ['utf-8', 'utf8'],
    ['ascii', 'ascii'],
    ['us-ascii', 'ascii'],
    ['latin1', 'latin1'],
    ['iso-8859-1', 'latin1'],
    ['iso88591', 'latin1'],
    ['binary', 'latin1'],
    ['utf16le', 'utf16le'],
    ['utf-16le', 'utf16le'],
    ['ucs2', 'ucs2'],
    ['ucs-2', 'ucs2']
]);

function resolveNodeEncoding(encoding) {
    const key = String(encoding || 'utf8').trim().toLowerCase();
    const mapped = NORMALIZED_ENCODINGS.get(key);
    if (!mapped) {
        throw new Error(`Encoding not recognized: '${encoding}'`);
    }
    return mapped;
}

function encodingExists(encoding) {
    return NORMALIZED_ENCODINGS.has(String(encoding || '').trim().toLowerCase());
}

function getDecoder(encoding) {
    const nodeEnc = resolveNodeEncoding(encoding);
    const decoder = new StringDecoder(nodeEnc);
    let strippedBom = false;
    return {
        write(buf) {
            const out = decoder.write(Buffer.isBuffer(buf) ? buf : Buffer.from(buf));
            if (!strippedBom && nodeEnc === 'utf8' && out.charCodeAt(0) === 0xfeff) {
                strippedBom = true;
                return out.slice(1);
            }
            strippedBom = true;
            return out;
        },
        end(buf) {
            const out = buf ? decoder.end(Buffer.isBuffer(buf) ? buf : Buffer.from(buf)) : decoder.end();
            if (!strippedBom && nodeEnc === 'utf8' && out && out.charCodeAt(0) === 0xfeff) {
                strippedBom = true;
                return out.slice(1);
            }
            return out;
        }
    };
}

function getEncoder(encoding) {
    const nodeEnc = resolveNodeEncoding(encoding);
    return {
        write(str) {
            return Buffer.from(String(str ?? ''), nodeEnc);
        },
        end() {
            return Buffer.alloc(0);
        }
    };
}

function decode(buf, encoding) {
    const d = getDecoder(encoding);
    const part = d.write(buf);
    const rest = d.end();
    return rest ? part + rest : part;
}

function encode(str, encoding) {
    return getEncoder(encoding).write(str);
}

module.exports = {
    supportsStreams: false,
    encodingExists,
    getDecoder,
    getEncoder,
    decode,
    encode
};
