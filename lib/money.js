import Decimal from "decimal.js";

export const MONEY_DECIMAL_PLACES = 2;

export function toDecimal(value) {
  if (value instanceof Decimal) return value;
  if (value === null || value === undefined || value === "") {
    return new Decimal(0);
  }
  return new Decimal(String(value));
}

export function toMoney(value) {
  return toDecimal(value).toDecimalPlaces(
    MONEY_DECIMAL_PLACES,
    Decimal.ROUND_HALF_UP,
  );
}

export function addMoney(...values) {
  return values
    .reduce((sum, value) => sum.plus(toDecimal(value)), new Decimal(0))
    .toDecimalPlaces(MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}

export function subtractMoney(left, right) {
  return toDecimal(left)
    .minus(toDecimal(right))
    .toDecimalPlaces(MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}

export function multiplyMoney(left, right) {
  return toDecimal(left)
    .times(toDecimal(right))
    .toDecimalPlaces(MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}

export function divideMoney(left, right) {
  return toDecimal(left)
    .div(toDecimal(right))
    .toDecimalPlaces(MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}

export function moneyToNumber(value) {
  return toMoney(value).toNumber();
}

export function moneyToString(value) {
  return toMoney(value).toFixed(MONEY_DECIMAL_PLACES);
}
