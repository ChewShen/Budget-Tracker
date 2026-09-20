import { Category, Tag, Transaction, MonthlySavings } from "./types";

export const INITIAL_CATEGORIES: Category[] = [
  {
    "id": "cat-1",
    "name": "Food"
  },
  {
    "id": "cat-2",
    "name": "Transport"
  },
  {
    "id": "cat-3",
    "name": "Home_Bills"
  },
  {
    "id": "cat-4",
    "name": "Self_care"
  },
  {
    "id": "cat-5",
    "name": "Subscription"
  },
  {
    "id": "cat-6",
    "name": "Health"
  },
  {
    "id": "cat-7",
    "name": "Own_Interest"
  },
  {
    "id": "cat-8",
    "name": "Entertainment"
  },
  {
    "id": "cat-9",
    "name": "Shopping"
  },
  {
    "id": "cat-10",
    "name": "Others"
  }
];

export const INITIAL_TAGS: Tag[] = [
  {
    "id": "tag-1",
    "category_id": "cat-1",
    "name": "Breakfast"
  },
  {
    "id": "tag-2",
    "category_id": "cat-1",
    "name": "Lunch"
  },
  {
    "id": "tag-3",
    "category_id": "cat-1",
    "name": "Dinner"
  },
  {
    "id": "tag-4",
    "category_id": "cat-1",
    "name": "Brunch"
  },
  {
    "id": "tag-5",
    "category_id": "cat-1",
    "name": "Morning Coffee"
  },
  {
    "id": "tag-6",
    "category_id": "cat-1",
    "name": "Snack"
  },
  {
    "id": "tag-7",
    "category_id": "cat-1",
    "name": "Supper"
  },
  {
    "id": "tag-8",
    "category_id": "cat-1",
    "name": "Breakfast & Lunch"
  },
  {
    "id": "tag-9",
    "category_id": "cat-2",
    "name": "Petrol"
  },
  {
    "id": "tag-10",
    "category_id": "cat-2",
    "name": "Toll"
  },
  {
    "id": "tag-11",
    "category_id": "cat-2",
    "name": "Parking"
  },
  {
    "id": "tag-12",
    "category_id": "cat-2",
    "name": "Public Trans"
  },
  {
    "id": "tag-13",
    "category_id": "cat-2",
    "name": "Season Parking"
  },
  {
    "id": "tag-14",
    "category_id": "cat-3",
    "name": "Water"
  },
  {
    "id": "tag-15",
    "category_id": "cat-3",
    "name": "Electric"
  },
  {
    "id": "tag-16",
    "category_id": "cat-3",
    "name": "Cuckoo"
  },
  {
    "id": "tag-17",
    "category_id": "cat-3",
    "name": "Indah Water"
  },
  {
    "id": "tag-18",
    "category_id": "cat-4",
    "name": "Haircut"
  },
  {
    "id": "tag-19",
    "category_id": "cat-4",
    "name": "Product"
  },
  {
    "id": "tag-20",
    "category_id": "cat-5",
    "name": "iCloud"
  },
  {
    "id": "tag-21",
    "category_id": "cat-5",
    "name": "Netflix"
  },
  {
    "id": "tag-22",
    "category_id": "cat-5",
    "name": "Youtube Premium"
  },
  {
    "id": "tag-23",
    "category_id": "cat-5",
    "name": "Youtube Membership"
  },
  {
    "id": "tag-24",
    "category_id": "cat-6",
    "name": "Hospital"
  },
  {
    "id": "tag-25",
    "category_id": "cat-6",
    "name": "Clinic"
  },
  {
    "id": "tag-26",
    "category_id": "cat-6",
    "name": "Drugs"
  },
  {
    "id": "tag-27",
    "category_id": "cat-7",
    "name": "Guitar Class"
  },
  {
    "id": "tag-28",
    "category_id": "cat-8",
    "name": "Movie"
  },
  {
    "id": "tag-29",
    "category_id": "cat-9",
    "name": "Accessories"
  },
  {
    "id": "tag-30",
    "category_id": "cat-9",
    "name": "Groceries"
  },
  {
    "id": "tag-31",
    "category_id": "cat-10",
    "name": "Photo"
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    "id": "tx-1",
    "date": "2026-08-01",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-4",
    "tag_name": "Brunch",
    "description": "",
    "amount": 15.9,
    "is_one_off": false
  },
  {
    "id": "tx-2",
    "date": "2026-08-01",
    "category_id": "cat-5",
    "category_name": "Subscription",
    "tag_id": "tag-22",
    "tag_name": "Youtube Premium",
    "description": "",
    "amount": 17.9,
    "is_one_off": false
  },
  {
    "id": "tx-3",
    "date": "2026-08-02",
    "category_id": "cat-3",
    "category_name": "Home_Bills",
    "tag_id": "tag-16",
    "tag_name": "Cuckoo",
    "description": "",
    "amount": 80.0,
    "is_one_off": false
  },
  {
    "id": "tx-4",
    "date": "2026-08-03",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 17.6,
    "is_one_off": false
  },
  {
    "id": "tx-5",
    "date": "2026-08-04",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-5",
    "tag_name": "Morning Coffee",
    "description": "",
    "amount": 10.9,
    "is_one_off": false
  },
  {
    "id": "tx-6",
    "date": "2026-08-04",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 10.0,
    "is_one_off": false
  },
  {
    "id": "tx-7",
    "date": "2026-08-04",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 21.0,
    "is_one_off": false
  },
  {
    "id": "tx-8",
    "date": "2026-08-04",
    "category_id": "cat-2",
    "category_name": "Transport",
    "tag_id": "tag-11",
    "tag_name": "Parking",
    "description": "",
    "amount": 10.0,
    "is_one_off": false
  },
  {
    "id": "tx-9",
    "date": "2026-08-05",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-5",
    "tag_name": "Morning Coffee",
    "description": "",
    "amount": 10.9,
    "is_one_off": false
  },
  {
    "id": "tx-10",
    "date": "2026-08-05",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 7.5,
    "is_one_off": false
  },
  {
    "id": "tx-11",
    "date": "2026-08-05",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 10.2,
    "is_one_off": false
  },
  {
    "id": "tx-12",
    "date": "2026-08-06",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-5",
    "tag_name": "Morning Coffee",
    "description": "",
    "amount": 12.2,
    "is_one_off": false
  },
  {
    "id": "tx-13",
    "date": "2026-08-06",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 10.5,
    "is_one_off": false
  },
  {
    "id": "tx-14",
    "date": "2026-08-06",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 12.2,
    "is_one_off": false
  },
  {
    "id": "tx-15",
    "date": "2026-08-06",
    "category_id": "cat-2",
    "category_name": "Transport",
    "tag_id": "tag-9",
    "tag_name": "Petrol",
    "description": "",
    "amount": 55.0,
    "is_one_off": false
  },
  {
    "id": "tx-16",
    "date": "2026-08-07",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 10.2,
    "is_one_off": false
  },
  {
    "id": "tx-17",
    "date": "2026-08-07",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-5",
    "tag_name": "Morning Coffee",
    "description": "",
    "amount": 7.4,
    "is_one_off": false
  },
  {
    "id": "tx-18",
    "date": "2026-08-07",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 7.0,
    "is_one_off": false
  },
  {
    "id": "tx-19",
    "date": "2026-08-07",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-6",
    "tag_name": "Snack",
    "description": "",
    "amount": 11.0,
    "is_one_off": false
  },
  {
    "id": "tx-20",
    "date": "2026-08-07",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 28.05,
    "is_one_off": false
  },
  {
    "id": "tx-21",
    "date": "2026-08-07",
    "category_id": "cat-4",
    "category_name": "Self_care",
    "tag_id": "tag-18",
    "tag_name": "Haircut",
    "description": "",
    "amount": 52.0,
    "is_one_off": false
  },
  {
    "id": "tx-22",
    "date": "2026-08-07",
    "category_id": "cat-5",
    "category_name": "Subscription",
    "tag_id": "tag-21",
    "tag_name": "Netflix",
    "description": "",
    "amount": 29.9,
    "is_one_off": false
  },
  {
    "id": "tx-23",
    "date": "2026-08-08",
    "category_id": "cat-10",
    "category_name": "Others",
    "tag_id": "tag-31",
    "tag_name": "Photo",
    "description": "",
    "amount": 29.0,
    "is_one_off": false
  },
  {
    "id": "tx-24",
    "date": "2026-08-08",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 18.9,
    "is_one_off": false
  },
  {
    "id": "tx-25",
    "date": "2026-08-08",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 14.6,
    "is_one_off": false
  },
  {
    "id": "tx-26",
    "date": "2026-08-09",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-5",
    "tag_name": "Morning Coffee",
    "description": "",
    "amount": 4.8,
    "is_one_off": false
  },
  {
    "id": "tx-27",
    "date": "2026-08-09",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 8.0,
    "is_one_off": false
  },
  {
    "id": "tx-28",
    "date": "2026-08-09",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 11.0,
    "is_one_off": false
  },
  {
    "id": "tx-29",
    "date": "2026-08-09",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "For next day (Aug 10)",
    "amount": 5.2,
    "is_one_off": false
  },
  {
    "id": "tx-30",
    "date": "2026-08-09",
    "category_id": "cat-7",
    "category_name": "Own_Interest",
    "tag_id": "tag-27",
    "tag_name": "Guitar Class",
    "description": "",
    "amount": 220.0,
    "is_one_off": false
  },
  {
    "id": "tx-31",
    "date": "2026-08-10",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 9.0,
    "is_one_off": false
  },
  {
    "id": "tx-32",
    "date": "2026-08-10",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 14.9,
    "is_one_off": false
  },
  {
    "id": "tx-33",
    "date": "2026-08-11",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 7.0,
    "is_one_off": false
  },
  {
    "id": "tx-34",
    "date": "2026-08-11",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 15.3,
    "is_one_off": false
  },
  {
    "id": "tx-35",
    "date": "2026-08-11",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-6",
    "tag_name": "Snack",
    "description": "",
    "amount": 3.0,
    "is_one_off": false
  },
  {
    "id": "tx-36",
    "date": "2026-08-12",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-4",
    "tag_name": "Brunch",
    "description": "",
    "amount": 13.1,
    "is_one_off": false
  },
  {
    "id": "tx-37",
    "date": "2026-08-12",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 24.0,
    "is_one_off": false
  },
  {
    "id": "tx-38",
    "date": "2026-08-13",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 9.1,
    "is_one_off": false
  },
  {
    "id": "tx-39",
    "date": "2026-08-13",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 24.3,
    "is_one_off": false
  },
  {
    "id": "tx-40",
    "date": "2026-08-13",
    "category_id": "cat-9",
    "category_name": "Shopping",
    "tag_id": "tag-29",
    "tag_name": "Accessories",
    "description": "",
    "amount": 11.0,
    "is_one_off": false
  },
  {
    "id": "tx-41",
    "date": "2026-08-14",
    "category_id": "cat-3",
    "category_name": "Home_Bills",
    "tag_id": "tag-14",
    "tag_name": "Water",
    "description": "",
    "amount": 11.05,
    "is_one_off": false
  },
  {
    "id": "tx-42",
    "date": "2026-08-14",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 3.3,
    "is_one_off": false
  },
  {
    "id": "tx-43",
    "date": "2026-08-14",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 13.5,
    "is_one_off": false
  },
  {
    "id": "tx-44",
    "date": "2026-08-14",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-5",
    "tag_name": "Morning Coffee",
    "description": "",
    "amount": 3.5,
    "is_one_off": false
  },
  {
    "id": "tx-45",
    "date": "2026-08-14",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 27.5,
    "is_one_off": false
  },
  {
    "id": "tx-46",
    "date": "2026-08-14",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-7",
    "tag_name": "Supper",
    "description": "",
    "amount": 8.5,
    "is_one_off": false
  },
  {
    "id": "tx-47",
    "date": "2026-08-15",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-4",
    "tag_name": "Brunch",
    "description": "",
    "amount": 18.9,
    "is_one_off": false
  },
  {
    "id": "tx-48",
    "date": "2026-08-15",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 19.3,
    "is_one_off": false
  },
  {
    "id": "tx-49",
    "date": "2026-08-16",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 11.0,
    "is_one_off": false
  },
  {
    "id": "tx-50",
    "date": "2026-08-16",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 15.0,
    "is_one_off": false
  },
  {
    "id": "tx-51",
    "date": "2026-08-16",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "For next 2 day",
    "amount": 8.8,
    "is_one_off": false
  },
  {
    "id": "tx-52",
    "date": "2026-08-17",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 10.0,
    "is_one_off": false
  },
  {
    "id": "tx-53",
    "date": "2026-08-17",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-6",
    "tag_name": "Snack",
    "description": "",
    "amount": 20.0,
    "is_one_off": false
  },
  {
    "id": "tx-54",
    "date": "2026-08-17",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 14.2,
    "is_one_off": false
  },
  {
    "id": "tx-55",
    "date": "2026-08-18",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 12.7,
    "is_one_off": false
  },
  {
    "id": "tx-56",
    "date": "2026-08-18",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 19.0,
    "is_one_off": false
  },
  {
    "id": "tx-57",
    "date": "2026-08-19",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 15.5,
    "is_one_off": false
  },
  {
    "id": "tx-58",
    "date": "2026-08-19",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-5",
    "tag_name": "Morning Coffee",
    "description": "",
    "amount": 3.5,
    "is_one_off": false
  },
  {
    "id": "tx-59",
    "date": "2026-08-19",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 13.5,
    "is_one_off": false
  },
  {
    "id": "tx-60",
    "date": "2026-08-19",
    "category_id": "cat-9",
    "category_name": "Shopping",
    "tag_id": "tag-29",
    "tag_name": "Accessories",
    "description": "",
    "amount": 21.5,
    "is_one_off": false
  },
  {
    "id": "tx-61",
    "date": "2026-08-19",
    "category_id": "cat-2",
    "category_name": "Transport",
    "tag_id": "tag-9",
    "tag_name": "Petrol",
    "description": "",
    "amount": 51.3,
    "is_one_off": false
  },
  {
    "id": "tx-62",
    "date": "2026-08-20",
    "category_id": "cat-3",
    "category_name": "Home_Bills",
    "tag_id": "tag-15",
    "tag_name": "Electric",
    "description": "",
    "amount": 110.0,
    "is_one_off": false
  },
  {
    "id": "tx-63",
    "date": "2026-08-20",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 13.5,
    "is_one_off": false
  },
  {
    "id": "tx-64",
    "date": "2026-08-20",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 6.7,
    "is_one_off": false
  },
  {
    "id": "tx-65",
    "date": "2026-08-20",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 14.5,
    "is_one_off": false
  },
  {
    "id": "tx-66",
    "date": "2026-08-20",
    "category_id": "cat-3",
    "category_name": "Home_Bills",
    "tag_id": "tag-17",
    "tag_name": "Indah Water",
    "description": "",
    "amount": 90.0,
    "is_one_off": false
  },
  {
    "id": "tx-67",
    "date": "2026-08-21",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 27.5,
    "is_one_off": false
  },
  {
    "id": "tx-68",
    "date": "2026-08-21",
    "category_id": "cat-8",
    "category_name": "Entertainment",
    "tag_id": "tag-28",
    "tag_name": "Movie",
    "description": "",
    "amount": 27.5,
    "is_one_off": false
  },
  {
    "id": "tx-69",
    "date": "2026-08-21",
    "category_id": "cat-2",
    "category_name": "Transport",
    "tag_id": "tag-10",
    "tag_name": "Toll",
    "description": "",
    "amount": 4.2,
    "is_one_off": false
  },
  {
    "id": "tx-70",
    "date": "2026-08-21",
    "category_id": "cat-2",
    "category_name": "Transport",
    "tag_id": "tag-11",
    "tag_name": "Parking",
    "description": "",
    "amount": 6.0,
    "is_one_off": false
  },
  {
    "id": "tx-71",
    "date": "2026-08-21",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-4",
    "tag_name": "Brunch",
    "description": "",
    "amount": 13.7,
    "is_one_off": false
  },
  {
    "id": "tx-72",
    "date": "2026-08-22",
    "category_id": "cat-6",
    "category_name": "Health",
    "tag_id": "tag-24",
    "tag_name": "Hospital",
    "description": "",
    "amount": 319.0,
    "is_one_off": true
  },
  {
    "id": "tx-73",
    "date": "2026-08-22",
    "category_id": "cat-2",
    "category_name": "Transport",
    "tag_id": "tag-11",
    "tag_name": "Parking",
    "description": "",
    "amount": 3.0,
    "is_one_off": false
  },
  {
    "id": "tx-74",
    "date": "2026-08-22",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-6",
    "tag_name": "Snack",
    "description": "",
    "amount": 4.0,
    "is_one_off": false
  },
  {
    "id": "tx-75",
    "date": "2026-08-22",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 13.0,
    "is_one_off": false
  },
  {
    "id": "tx-76",
    "date": "2026-08-23",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 11.0,
    "is_one_off": false
  },
  {
    "id": "tx-77",
    "date": "2026-08-23",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 21.0,
    "is_one_off": false
  },
  {
    "id": "tx-78",
    "date": "2026-08-23",
    "category_id": "cat-2",
    "category_name": "Transport",
    "tag_id": "tag-11",
    "tag_name": "Parking",
    "description": "",
    "amount": 1.0,
    "is_one_off": false
  },
  {
    "id": "tx-79",
    "date": "2026-08-23",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 15.9,
    "is_one_off": false
  },
  {
    "id": "tx-80",
    "date": "2026-08-24",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-5",
    "tag_name": "Morning Coffee",
    "description": "",
    "amount": 7.9,
    "is_one_off": false
  },
  {
    "id": "tx-81",
    "date": "2026-08-24",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 10.0,
    "is_one_off": false
  },
  {
    "id": "tx-82",
    "date": "2026-08-24",
    "category_id": "cat-8",
    "category_name": "Entertainment",
    "tag_id": "tag-28",
    "tag_name": "Movie",
    "description": "",
    "amount": 22.5,
    "is_one_off": false
  },
  {
    "id": "tx-83",
    "date": "2026-08-24",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 24.0,
    "is_one_off": false
  },
  {
    "id": "tx-84",
    "date": "2026-08-24",
    "category_id": "cat-6",
    "category_name": "Health",
    "tag_id": "tag-26",
    "tag_name": "Drugs",
    "description": "",
    "amount": 10.5,
    "is_one_off": false
  },
  {
    "id": "tx-85",
    "date": "2026-08-25",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-4",
    "tag_name": "Brunch",
    "description": "",
    "amount": 18.86,
    "is_one_off": false
  },
  {
    "id": "tx-86",
    "date": "2026-08-25",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 17.0,
    "is_one_off": false
  },
  {
    "id": "tx-87",
    "date": "2026-08-25",
    "category_id": "cat-5",
    "category_name": "Subscription",
    "tag_id": "tag-20",
    "tag_name": "iCloud",
    "description": "",
    "amount": 3.9,
    "is_one_off": false
  },
  {
    "id": "tx-88",
    "date": "2026-08-25",
    "category_id": "cat-5",
    "category_name": "Subscription",
    "tag_id": "tag-23",
    "tag_name": "Youtube Membership",
    "description": "",
    "amount": 10.0,
    "is_one_off": false
  },
  {
    "id": "tx-89",
    "date": "2026-08-26",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-8",
    "tag_name": "Breakfast & Lunch",
    "description": "",
    "amount": 15.6,
    "is_one_off": false
  },
  {
    "id": "tx-90",
    "date": "2026-08-26",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 17.9,
    "is_one_off": false
  },
  {
    "id": "tx-91",
    "date": "2026-08-27",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 10.0,
    "is_one_off": false
  },
  {
    "id": "tx-92",
    "date": "2026-08-27",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 21.1,
    "is_one_off": false
  },
  {
    "id": "tx-93",
    "date": "2026-08-28",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 21.5,
    "is_one_off": false
  },
  {
    "id": "tx-94",
    "date": "2026-08-28",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 7.5,
    "is_one_off": false
  },
  {
    "id": "tx-95",
    "date": "2026-08-28",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 13.5,
    "is_one_off": false
  },
  {
    "id": "tx-96",
    "date": "2026-08-28",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-7",
    "tag_name": "Supper",
    "description": "",
    "amount": 3.8,
    "is_one_off": false
  },
  {
    "id": "tx-97",
    "date": "2026-08-29",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-4",
    "tag_name": "Brunch",
    "description": "",
    "amount": 18.0,
    "is_one_off": false
  },
  {
    "id": "tx-98",
    "date": "2026-08-29",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 18.0,
    "is_one_off": false
  },
  {
    "id": "tx-99",
    "date": "2026-08-29",
    "category_id": "cat-2",
    "category_name": "Transport",
    "tag_id": "tag-13",
    "tag_name": "Season Parking",
    "description": "",
    "amount": 120.0,
    "is_one_off": false
  },
  {
    "id": "tx-100",
    "date": "2026-08-30",
    "category_id": "cat-2",
    "category_name": "Transport",
    "tag_id": "tag-11",
    "tag_name": "Parking",
    "description": "",
    "amount": 2.5,
    "is_one_off": false
  },
  {
    "id": "tx-101",
    "date": "2026-08-30",
    "category_id": "cat-9",
    "category_name": "Shopping",
    "tag_id": "tag-30",
    "tag_name": "Groceries",
    "description": "Jaya Grocer + Mr.diy",
    "amount": 29.0,
    "is_one_off": false
  },
  {
    "id": "tx-102",
    "date": "2026-08-30",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 12.0,
    "is_one_off": false
  },
  {
    "id": "tx-103",
    "date": "2026-08-30",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-6",
    "tag_name": "Snack",
    "description": "",
    "amount": 7.0,
    "is_one_off": false
  },
  {
    "id": "tx-104",
    "date": "2026-08-31",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 18.9,
    "is_one_off": false
  },
  {
    "id": "tx-105",
    "date": "2026-08-31",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 11.5,
    "is_one_off": false
  },
  {
    "id": "tx-106",
    "date": "2026-09-01",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 19.0,
    "is_one_off": false
  },
  {
    "id": "tx-107",
    "date": "2026-09-01",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 9.0,
    "is_one_off": false
  },
  {
    "id": "tx-108",
    "date": "2026-09-01",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 15.3,
    "is_one_off": false
  },
  {
    "id": "tx-109",
    "date": "2026-09-01",
    "category_id": "cat-5",
    "category_name": "Subscription",
    "tag_id": "tag-22",
    "tag_name": "Youtube Premium",
    "description": "",
    "amount": 20.9,
    "is_one_off": false
  },
  {
    "id": "tx-110",
    "date": "2026-09-01",
    "category_id": "cat-9",
    "category_name": "Shopping",
    "tag_id": "tag-29",
    "tag_name": "Accessories",
    "description": "car wiper",
    "amount": 42.9,
    "is_one_off": false
  },
  {
    "id": "tx-111",
    "date": "2026-09-02",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-8",
    "tag_name": "Breakfast & Lunch",
    "description": "",
    "amount": 21.9,
    "is_one_off": false
  },
  {
    "id": "tx-112",
    "date": "2026-09-02",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 12.1,
    "is_one_off": false
  },
  {
    "id": "tx-113",
    "date": "2026-09-02",
    "category_id": "cat-9",
    "category_name": "Shopping",
    "tag_id": "tag-29",
    "tag_name": "Accessories",
    "description": "nfc tag",
    "amount": 5.67,
    "is_one_off": false
  },
  {
    "id": "tx-114",
    "date": "2026-09-03",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 8.5,
    "is_one_off": false
  },
  {
    "id": "tx-115",
    "date": "2026-09-03",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 13.5,
    "is_one_off": false
  },
  {
    "id": "tx-116",
    "date": "2026-09-03",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 12.0,
    "is_one_off": false
  },
  {
    "id": "tx-117",
    "date": "2026-09-04",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 6.9,
    "is_one_off": false
  },
  {
    "id": "tx-118",
    "date": "2026-09-04",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 7.9,
    "is_one_off": false
  },
  {
    "id": "tx-119",
    "date": "2026-09-04",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 15.5,
    "is_one_off": false
  },
  {
    "id": "tx-120",
    "date": "2026-09-04",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-7",
    "tag_name": "Supper",
    "description": "",
    "amount": 5.2,
    "is_one_off": false
  },
  {
    "id": "tx-121",
    "date": "2026-09-04",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-6",
    "tag_name": "Snack",
    "description": "",
    "amount": 5.0,
    "is_one_off": false
  },
  {
    "id": "tx-122",
    "date": "2026-09-05",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 18.5,
    "is_one_off": false
  },
  {
    "id": "tx-123",
    "date": "2026-09-05",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 17.5,
    "is_one_off": false
  },
  {
    "id": "tx-124",
    "date": "2026-09-06",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 12.2,
    "is_one_off": false
  },
  {
    "id": "tx-125",
    "date": "2026-09-06",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 12.7,
    "is_one_off": false
  },
  {
    "id": "tx-126",
    "date": "2026-09-06",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-6",
    "tag_name": "Snack",
    "description": "",
    "amount": 4.0,
    "is_one_off": false
  },
  {
    "id": "tx-127",
    "date": "2026-09-06",
    "category_id": "cat-7",
    "category_name": "Own_Interest",
    "tag_id": "tag-27",
    "tag_name": "Guitar Class",
    "description": "",
    "amount": 220.0,
    "is_one_off": false
  },
  {
    "id": "tx-128",
    "date": "2026-09-06",
    "category_id": "cat-3",
    "category_name": "Home_Bills",
    "tag_id": "tag-16",
    "tag_name": "Cuckoo",
    "description": "",
    "amount": 80.0,
    "is_one_off": false
  },
  {
    "id": "tx-129",
    "date": "2026-09-07",
    "category_id": "cat-5",
    "category_name": "Subscription",
    "tag_id": "tag-21",
    "tag_name": "Netflix",
    "description": "",
    "amount": 29.9,
    "is_one_off": false
  },
  {
    "id": "tx-130",
    "date": "2026-09-07",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 1.7,
    "is_one_off": false
  },
  {
    "id": "tx-131",
    "date": "2026-09-07",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 17.6,
    "is_one_off": false
  },
  {
    "id": "tx-132",
    "date": "2026-09-07",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 21.1,
    "is_one_off": false
  },
  {
    "id": "tx-133",
    "date": "2026-09-08",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 4.5,
    "is_one_off": false
  },
  {
    "id": "tx-134",
    "date": "2026-09-08",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 13.5,
    "is_one_off": false
  },
  {
    "id": "tx-135",
    "date": "2026-09-08",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 16.9,
    "is_one_off": false
  },
  {
    "id": "tx-136",
    "date": "2026-09-09",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-8",
    "tag_name": "Breakfast & Lunch",
    "description": "",
    "amount": 18.9,
    "is_one_off": false
  },
  {
    "id": "tx-137",
    "date": "2026-09-09",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 17.4,
    "is_one_off": false
  },
  {
    "id": "tx-138",
    "date": "2026-09-10",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-8",
    "tag_name": "Breakfast & Lunch",
    "description": "",
    "amount": 14.3,
    "is_one_off": false
  },
  {
    "id": "tx-139",
    "date": "2026-09-10",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 25.0,
    "is_one_off": false
  },
  {
    "id": "tx-140",
    "date": "2026-09-11",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 10.0,
    "is_one_off": false
  },
  {
    "id": "tx-141",
    "date": "2026-09-11",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 16.7,
    "is_one_off": false
  },
  {
    "id": "tx-142",
    "date": "2026-09-11",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-7",
    "tag_name": "Supper",
    "description": "",
    "amount": 7.7,
    "is_one_off": false
  },
  {
    "id": "tx-143",
    "date": "2026-09-12",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 6.6,
    "is_one_off": false
  },
  {
    "id": "tx-144",
    "date": "2026-09-12",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 18.5,
    "is_one_off": false
  },
  {
    "id": "tx-145",
    "date": "2026-09-12",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 15.0,
    "is_one_off": false
  },
  {
    "id": "tx-146",
    "date": "2026-09-12",
    "category_id": "cat-9",
    "category_name": "Shopping",
    "tag_id": "tag-29",
    "tag_name": "Accessories",
    "description": "baking soda",
    "amount": 4.6,
    "is_one_off": false
  },
  {
    "id": "tx-147",
    "date": "2026-09-12",
    "category_id": "cat-9",
    "category_name": "Shopping",
    "tag_id": "tag-29",
    "tag_name": "Accessories",
    "description": "hydrogen peroxide",
    "amount": 9.9,
    "is_one_off": false
  },
  {
    "id": "tx-148",
    "date": "2026-09-12",
    "category_id": "cat-9",
    "category_name": "Shopping",
    "tag_id": "tag-29",
    "tag_name": "Accessories",
    "description": "guitar strap",
    "amount": 25.0,
    "is_one_off": false
  },
  {
    "id": "tx-149",
    "date": "2026-09-12",
    "category_id": "cat-9",
    "category_name": "Shopping",
    "tag_id": "tag-29",
    "tag_name": "Accessories",
    "description": "Brush",
    "amount": 7.9,
    "is_one_off": false
  },
  {
    "id": "tx-150",
    "date": "2026-09-13",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 19.5,
    "is_one_off": false
  },
  {
    "id": "tx-151",
    "date": "2026-09-13",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 12.8,
    "is_one_off": false
  },
  {
    "id": "tx-152",
    "date": "2026-09-13",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 12.6,
    "is_one_off": false
  },
  {
    "id": "tx-153",
    "date": "2026-09-13",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-6",
    "tag_name": "Snack",
    "description": "",
    "amount": 7.7,
    "is_one_off": false
  },
  {
    "id": "tx-154",
    "date": "2026-09-13",
    "category_id": "cat-2",
    "category_name": "Transport",
    "tag_id": "tag-9",
    "tag_name": "Petrol",
    "description": "",
    "amount": 51.5,
    "is_one_off": false
  },
  {
    "id": "tx-155",
    "date": "2026-09-14",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 13.3,
    "is_one_off": false
  },
  {
    "id": "tx-156",
    "date": "2026-09-14",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 9.9,
    "is_one_off": false
  },
  {
    "id": "tx-157",
    "date": "2026-09-15",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-8",
    "tag_name": "Breakfast & Lunch",
    "description": "",
    "amount": 18.9,
    "is_one_off": false
  },
  {
    "id": "tx-158",
    "date": "2026-09-15",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 30.0,
    "is_one_off": false
  },
  {
    "id": "tx-159",
    "date": "2026-09-16",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 15.0,
    "is_one_off": false
  },
  {
    "id": "tx-160",
    "date": "2026-09-16",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 18.28,
    "is_one_off": false
  },
  {
    "id": "tx-161",
    "date": "2026-09-16",
    "category_id": "cat-2",
    "category_name": "Transport",
    "tag_id": "tag-10",
    "tag_name": "Toll",
    "description": "",
    "amount": 1.0,
    "is_one_off": false
  },
  {
    "id": "tx-162",
    "date": "2026-09-17",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-8",
    "tag_name": "Breakfast & Lunch",
    "description": "",
    "amount": 15.3,
    "is_one_off": false
  },
  {
    "id": "tx-163",
    "date": "2026-09-17",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 21.7,
    "is_one_off": false
  },
  {
    "id": "tx-164",
    "date": "2026-09-17",
    "category_id": "cat-5",
    "category_name": "Subscription",
    "tag_id": "tag-23",
    "tag_name": "Youtube Membership",
    "description": "",
    "amount": 10.0,
    "is_one_off": false
  },
  {
    "id": "tx-165",
    "date": "2026-09-17",
    "category_id": "cat-3",
    "category_name": "Home_Bills",
    "tag_id": "tag-14",
    "tag_name": "Water",
    "description": "",
    "amount": 7.15,
    "is_one_off": false
  },
  {
    "id": "tx-166",
    "date": "2026-09-18",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-5",
    "tag_name": "Morning Coffee",
    "description": "",
    "amount": 1.6,
    "is_one_off": false
  },
  {
    "id": "tx-167",
    "date": "2026-09-18",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 10.0,
    "is_one_off": false
  },
  {
    "id": "tx-168",
    "date": "2026-09-18",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-3",
    "tag_name": "Dinner",
    "description": "",
    "amount": 13.5,
    "is_one_off": false
  },
  {
    "id": "tx-169",
    "date": "2026-09-19",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-1",
    "tag_name": "Breakfast",
    "description": "",
    "amount": 17.3,
    "is_one_off": false
  },
  {
    "id": "tx-170",
    "date": "2026-09-19",
    "category_id": "cat-1",
    "category_name": "Food",
    "tag_id": "tag-2",
    "tag_name": "Lunch",
    "description": "",
    "amount": 10.0,
    "is_one_off": false
  },
  {
    "id": "tx-171",
    "date": "2026-09-19",
    "category_id": "cat-4",
    "category_name": "Self_care",
    "tag_id": "tag-18",
    "tag_name": "Haircut",
    "description": "",
    "amount": 52.0,
    "is_one_off": false
  },
  {
    "id": "tx-172",
    "date": "2026-09-19",
    "category_id": "cat-4",
    "category_name": "Self_care",
    "tag_id": "tag-19",
    "tag_name": "Product",
    "description": "",
    "amount": 58.0,
    "is_one_off": false
  }
];

export const INITIAL_SAVINGS: MonthlySavings[] = [
  {
    "id": "sav-1",
    "month": "2026-08-01",
    "main_checking": 0.0,
    "gx_bank": 3558.62,
    "gx_rate": 0.0355,
    "ryt_bank": 0.0,
    "ryt_rate": 0.0,
    "epf_locked": 10.0
  },
  {
    "id": "sav-2",
    "month": "2026-09-01",
    "main_checking": 0.0,
    "gx_bank": 0.0,
    "gx_rate": 0.0355,
    "ryt_bank": 0.0,
    "ryt_rate": 0.0,
    "epf_locked": 0.0
  },
  {
    "id": "sav-3",
    "month": "2026-10-01",
    "main_checking": 0.0,
    "gx_bank": 0.0,
    "gx_rate": 0.0355,
    "ryt_bank": 0.0,
    "ryt_rate": 0.0,
    "epf_locked": 0.0
  },
  {
    "id": "sav-4",
    "month": "2026-11-01",
    "main_checking": 0.0,
    "gx_bank": 0.0,
    "gx_rate": 0.0355,
    "ryt_bank": 0.0,
    "ryt_rate": 0.0,
    "epf_locked": 0.0
  },
  {
    "id": "sav-5",
    "month": "2026-12-01",
    "main_checking": 0.0,
    "gx_bank": 0.0,
    "gx_rate": 0.0355,
    "ryt_bank": 0.0,
    "ryt_rate": 0.0,
    "epf_locked": 0.0
  }
];
