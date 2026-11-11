import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { appendSpoken, normalizeSpoken, spokenToIdentifier, spokenToNumber, spokenToText } from './spokenValue.ts';

describe('spoken numbers', () => {
  it('reads digits, commas and currency marks', () => {
    assert.equal(spokenToNumber('₹ 12,50,000'), '1250000');
    assert.equal(spokenToNumber('Rs. 45,000 only'), '45000');
    assert.equal(spokenToNumber('12.5'), '12.5');
    assert.equal(spokenToNumber('18%'), '18');
  });
  it('reads English number words', () => {
    assert.equal(spokenToNumber('twelve lakh fifty thousand'), '1250000');
    assert.equal(spokenToNumber('two hundred and fifty'), '250');
    assert.equal(spokenToNumber('three crore'), '30000000');
    assert.equal(spokenToNumber('twelve point five'), '12.5');
    assert.equal(spokenToNumber('five thousand'), '5000');
  });
  it('reads a number with a multiplier word', () => {
    assert.equal(spokenToNumber('12.5 lakh'), '1250000');
    assert.equal(spokenToNumber('3 crore'), '30000000');
  });
  it('reads Telugu numerals and number words', () => {
    assert.equal(spokenToNumber('౧౨౫'), '125');
    assert.equal(spokenToNumber('ఇరవై ఐదు'), '25');
    assert.equal(spokenToNumber('పది లక్షలు'), '1000000');
    assert.equal(spokenToNumber('రెండు వేల'.replace('వేల', 'వెయ్యి')), '2000');
  });
  it('counts in lakh when the field is in lakh', () => {
    assert.equal(spokenToNumber('twelve lakh fifty thousand', { lakh: true }), '12.5');
    assert.equal(spokenToNumber('12.5 lakh', { lakh: true }), '12.5');
    assert.equal(spokenToNumber('twelve point five', { lakh: true }), '12.5');
    assert.equal(spokenToNumber('1250000', { lakh: true }), '12.5');
    assert.equal(spokenToNumber('2.75', { lakh: true }), '2.75');
  });
  it('gives nothing for words that are not a number', () => {
    assert.equal(spokenToNumber('hello there'), '');
    assert.equal(spokenToNumber(''), '');
  });
});

describe('spoken identifiers', () => {
  it('writes a PAN or GSTIN without spaces, in capitals, with digit words as digits', () => {
    assert.equal(spokenToIdentifier('B K T P R four eight two one M', 'pan'), 'BKTPR4821M');
    assert.equal(spokenToIdentifier('37 AAHFK 4821 M 1 Z 5', 'gstin'), '37AAHFK4821M1Z5');
  });
  it('understands double and triple', () => {
    assert.equal(spokenToIdentifier('nine eight double four eight', 'mobile'), '98448');
    assert.equal(spokenToIdentifier('triple nine', 'mobile'), '999');
  });
  it('keeps only digits for a mobile number or PIN code', () => {
    assert.equal(spokenToIdentifier('98480 12345', 'mobile'), '9848012345');
    assert.equal(spokenToIdentifier('five two two zero zero one', 'pincode'), '522001');
  });
  it('builds an e-mail address', () => {
    assert.equal(spokenToIdentifier('ravi dot kommineni at example dot com', 'email'), 'ravi.kommineni@example.com');
    assert.equal(spokenToIdentifier('sita underscore devi at gmail dot com', 'email'), 'sita_devi@gmail.com');
  });
});

describe('spoken text', () => {
  it('drops the full stop on a short one-line answer only', () => {
    assert.equal(spokenToText('Sri Lakshmi Foods.'), 'Sri Lakshmi Foods');
    assert.equal(spokenToText('We make pickles. We sell in Guntur.'), 'We make pickles. We sell in Guntur.');
    assert.equal(spokenToText('  “Coastal Weave Unit”  '), 'Coastal Weave Unit');
  });
  it('appends to a long answer with one space', () => {
    assert.equal(appendSpoken('We make pickles.', 'We sell in Guntur.'), 'We make pickles. We sell in Guntur.');
    assert.equal(appendSpoken('', 'First words'), 'First words');
    assert.equal(appendSpoken('Already here', '  '), 'Already here');
  });
  it('picks the right cleaner by kind', () => {
    assert.equal(normalizeSpoken('twelve lakh', { kind: 'number', lakh: true }), '12');
    assert.equal(normalizeSpoken('b k t p r', { kind: 'identifier', format: 'pan' }), 'BKTPR');
    assert.equal(normalizeSpoken('Guntur.', {}), 'Guntur');
  });
});
