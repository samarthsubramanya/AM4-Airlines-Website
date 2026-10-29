export class SeatTakenError extends Error {
  constructor(seats) {
    super(`Seat(s) no longer available: ${seats.join(', ')}`);
    this.seats = seats;
  }
}
