const Booking = require('../../models/booking')
const Event = require('../../models/event')
const { transformEvent, transformBooking } = require('./merge')

module.exports = {
  bookings: async () => {
    try {
      const booking = await Booking.find()
      return booking.map(booking => {
        return transformBooking(booking)
      })
    } catch (err) {
      throw err
    }
  },
  bookEvent: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!')
    }

    const fetchedEvent = await Event.findOne({ _id: args.eventId })
    const booking = new Booking({
      user: req.userId,
      event: fetchedEvent,
    })
    const result = await booking.save()
    return transformBooking(result)
  },
  cancelBooking: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!')
    }

    try {
      const booking = await Booking.findById(args.bookingId).populate('event')

      if (!booking) {
        throw new Error('Booking not found.')
      }

      if (req.userId !== booking.user.toString()) {
        throw new Error('No Permission!')
      }

      const event = transformEvent(booking.event)
      await Booking.deleteOne({ _id: args.bookingId })
      return event
    } catch (err) {
      throw err
    }
  },
}
