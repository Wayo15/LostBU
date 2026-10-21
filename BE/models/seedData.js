// Demo data inserted ONLY when the items table is empty.
// Dates are relative to "today" so the demo always looks fresh.

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Index 0 is the oldest report, the last one is the newest.
const rawItems = [
  {
    type: "Lost", status: "Lost", name: "Student ID Card (Engineering)",
    category: "ID Cards",
    description: "Blue lanyard with a student ID card from the Faculty of Engineering. Last seen near the library entrance.",
    location: "Main Library, ground floor",
    contact: "Email: demo.student1@example.com",
  },
  {
    type: "Found", status: "Found", name: "Black leather wallet",
    category: "Wallets",
    description: "Black bi-fold leather wallet found on a bench. Contents not checked in public; owner should describe it to claim.",
    location: "Canteen A seating area",
    contact: "Drop-off: Security Office, Building 1",
  },
  {
    type: "Lost", status: "Found", name: "Dorm room keys with blue tag",
    category: "Keys",
    description: "Set of three keys on a ring with a blue plastic tag and a small bear keychain.",
    location: "Dormitory B parking area",
    contact: "LINE: demo_keys_finder",
  },
  {
    type: "Found", status: "Returned", name: "Stainless steel water bottle",
    category: "Bottles",
    description: "Green 500 ml insulated bottle with a mountain sticker. Returned to the owner after a description match.",
    location: "Sports Complex, lobby",
    contact: "Email: demo.finder2@example.com",
  },
  {
    type: "Lost", status: "Lost", name: "White wireless earbuds",
    category: "Electronics",
    description: "White earbuds in a charging case with a scratch on the lid. Lost after the morning lecture.",
    location: "Lecture Hall 3",
    contact: "LINE: demo_earbuds_owner",
  },
  {
    type: "Found", status: "Found", name: "Navy blue backpack",
    category: "Bags",
    description: "Navy backpack with a red zipper and a laptop compartment. Left unattended near the vending machines.",
    location: "Science Building, 2nd floor corridor",
    contact: "Drop-off: Science Building front desk",
  },
  {
    type: "Lost", status: "Returned", name: "Silver wristwatch",
    category: "Accessories",
    description: "Silver analog wristwatch with a brown leather strap. Returned to the owner by a classmate.",
    location: "Gymnasium locker room",
    contact: "Email: demo.student3@example.com",
  },
  {
    type: "Found", status: "Found", name: "Casio scientific calculator",
    category: "Electronics",
    description: "Grey scientific calculator with a name sticker partly peeled off. Found after the mathematics exam.",
    location: "Examination Hall, row F",
    contact: "Drop-off: Student Affairs Office",
  },
];

const seedItems = rawItems.map((item, index) => ({
  ...item,
  imageUrl: null,
  eventDate: daysAgo(10 - index).toISOString().slice(0, 10),
  createdAt: daysAgo(9 - index).toISOString(),
  updatedAt: daysAgo(9 - index).toISOString(),
}));

module.exports = { seedItems };