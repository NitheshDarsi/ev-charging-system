const mongoose = require("mongoose");
const Station = require("./models/Station");

mongoose.connect("mongodb://127.0.0.1:27017/evDB");

const seedData = async () => {
  await Station.deleteMany();

  const stations = [
    // ----------------------------------------------------
    // HYDERABAD (User's Exact Legacy Stations)
    // ----------------------------------------------------
    { _id: new mongoose.Types.ObjectId("69d0ade9aad73374f58035ec"), name: "Ather Grid - Sarath City Capital Mall", slots: 6, status: "open", lat: 17.4578, lng: 78.3639, pricePerHour: 250 },
    { _id: new mongoose.Types.ObjectId("69d0ade9aad73374f58035ed"), name: "Tata Power - Rajiv Gandhi International Airport (Shamshabad)", slots: 10, status: "open", lat: 17.2619, lng: 78.3876, pricePerHour: 300 },
    { _id: new mongoose.Types.ObjectId("69d0ade9aad73374f58035ee"), name: "Magenta ChargeGrid - Kompally CinePlanet", slots: 4, status: "open", lat: 17.5345, lng: 78.4844, pricePerHour: 240 },
    { _id: new mongoose.Types.ObjectId("69d0ade9aad73374f58035ef"), name: "Kazam EV - Uppal Metro Station", slots: 5, status: "open", lat: 17.4018, lng: 78.5602, pricePerHour: 220 },
    { _id: new mongoose.Types.ObjectId("69d0ade9aad73374f58035f0"), name: "ChargeMOD - Charminar Tourist Spot", slots: 2, status: "open", lat: 17.3616, lng: 78.4747, pricePerHour: 200 },
    { _id: new mongoose.Types.ObjectId("69d0ade9aad73374f58035f1"), name: "Exicom Charging - LB Nagar Ring Road", slots: 3, status: "under_work", lat: 17.3503, lng: 78.5463, pricePerHour: 210 },
    
    // ----------------------------------------------------
    // HYDERABAD (Newly Generated Grid)
    // ----------------------------------------------------
    { name: "EVRE Charging - Charminar Tourist Hub", slots: 4, status: "open", lat: 17.3616, lng: 78.4747, pricePerHour: 250 },
    { name: "Tata Power - Cyber Towers HITEC", slots: 6, status: "open", lat: 17.4504, lng: 78.3808, pricePerHour: 300 },
    { name: "Zeon EV - Banjara Hills Road No 10", slots: 2, status: "under_work", lat: 17.4156, lng: 78.4347, pricePerHour: 280 },
    { name: "Ather Grid - Secunderabad Station", slots: 5, status: "open", lat: 17.4399, lng: 78.5015, pricePerHour: 200 },
    { name: "Jio-bp pulse - Gachibowli Stadium", slots: 8, status: "open", lat: 17.4401, lng: 78.3489, pricePerHour: 290 },
    { name: "Volttic Hub - Shamshabad Airport", slots: 10, status: "open", lat: 17.2403, lng: 78.4294, pricePerHour: 350 },
    { name: "Tata Power - Kukatpally KPHB", slots: 4, status: "open", lat: 17.4948, lng: 78.3996, pricePerHour: 260 },
    { name: "ChargeZone - Jubilee Hills Checkpost", slots: 3, status: "open", lat: 17.4300, lng: 78.4076, pricePerHour: 320 },
    { name: "EV Fast - Dilsukhnagar Metro", slots: 5, status: "open", lat: 17.3686, lng: 78.5307, pricePerHour: 220 },
    { name: "Statiq - Madhapur Inorbit Mall", slots: 8, status: "open", lat: 17.4339, lng: 78.3860, pricePerHour: 290 },
    { name: "Fortum - Begumpet", slots: 4, status: "open", lat: 17.4437, lng: 78.4616, pricePerHour: 240 },
    { name: "TSSPDCL Public EV - Khairatabad", slots: 2, status: "open", lat: 17.4098, lng: 78.4601, pricePerHour: 180 },
    { name: "Jio-bp - L.B. Nagar", slots: 6, status: "open", lat: 17.3457, lng: 78.5522, pricePerHour: 250 },
    // NEW ONES:
    { name: "Zeon EV - Uppal Metro", slots: 4, status: "open", lat: 17.4026, lng: 78.5606, pricePerHour: 230 },
    { name: "Tata Power - Kondapur Junction", slots: 6, status: "open", lat: 17.4632, lng: 78.3571, pricePerHour: 290 },
    { name: "ChargeGrid - Mehdipatnam Rhythu Bazar", slots: 3, status: "open", lat: 17.3916, lng: 78.4312, pricePerHour: 220 },
    { name: "Ather Grid - Himayatnagar", slots: 5, status: "open", lat: 17.4024, lng: 78.4839, pricePerHour: 240 },
    { name: "Kazam EV - Tarnaka", slots: 4, status: "open", lat: 17.4284, lng: 78.5401, pricePerHour: 190 },
    { name: "Jio-bp pulse - Miyapur Cross Road", slots: 7, status: "open", lat: 17.4968, lng: 78.3614, pricePerHour: 280 },
    { name: "Statiq - Sanjeeva Reddy Nagar", slots: 5, status: "under_work", lat: 17.4398, lng: 78.4485, pricePerHour: 250 },
    { name: "Volttic - GVK One Mall", slots: 4, status: "open", lat: 17.4173, lng: 78.4481, pricePerHour: 350 },
    { name: "BHEL Township EV Hub", slots: 10, status: "open", lat: 17.5029, lng: 78.3079, pricePerHour: 200 },
    { name: "Zeon EV - Bowenpally", slots: 3, status: "open", lat: 17.4650, lng: 78.4800, pricePerHour: 220 },
  
    // ----------------------------------------------------
    // ANDHRA PRADESH (AP)
    // ----------------------------------------------------
    { name: "APEPDCL - Visakhapatnam Beach Road", slots: 6, status: "open", lat: 17.7142, lng: 83.3236, pricePerHour: 200 },
    { name: "Tata Power - MVP Colony, Vizag", slots: 4, status: "open", lat: 17.7441, lng: 83.3332, pricePerHour: 250 },
    { name: "Zeon EV - Vijayawada Benz Circle", slots: 5, status: "open", lat: 16.4971, lng: 80.6695, pricePerHour: 260 },
    { name: "Ather Grid - MG Road Vijayawada", slots: 3, status: "open", lat: 16.5050, lng: 80.6355, pricePerHour: 220 },
    { name: "ChargeZone - Tirupati Alipiri Toll", slots: 10, status: "open", lat: 13.6423, lng: 79.4002, pricePerHour: 300 },
    { name: "Statiq - Guntur Auto Nagar", slots: 4, status: "open", lat: 16.3067, lng: 80.4365, pricePerHour: 240 },
    { name: "Jio-bp pulse - Nellore NH16", slots: 8, status: "open", lat: 14.4377, lng: 79.9705, pricePerHour: 280 },
    { name: "Kurnool Highway EV charging", slots: 5, status: "under_work", lat: 15.8281, lng: 78.0373, pricePerHour: 250 },
    { name: "Rajamahendravaram Godavari Hub", slots: 4, status: "open", lat: 17.0005, lng: 81.8040, pricePerHour: 230 },
    { name: "Anantapur NH44 Supercharge", slots: 6, status: "open", lat: 14.6819, lng: 77.6006, pricePerHour: 290 },

    // ----------------------------------------------------
    // MUMBAI
    // ----------------------------------------------------
    { name: "Adani Electricity EV - BKC", slots: 7, status: "open", lat: 19.0657, lng: 72.8680, pricePerHour: 350 },
    { name: "Tata Power - Andheri East", slots: 5, status: "open", lat: 19.1136, lng: 72.8697, pricePerHour: 300 },
    { name: "ChargeGrid - South Mumbai Colaba", slots: 2, status: "open", lat: 18.9067, lng: 72.8147, pricePerHour: 400 },
    { name: "Jio-bp pulse - Navi Mumbai Vashi", slots: 10, status: "open", lat: 19.0745, lng: 72.9978, pricePerHour: 270 },
    { name: "Fortum Charge - Borivali", slots: 4, status: "under_work", lat: 19.2307, lng: 72.8567, pricePerHour: 280 },
    { name: "Zeon EV - Powai Lake", slots: 6, status: "open", lat: 19.1235, lng: 72.9037, pricePerHour: 310 },
    { name: "Tata Power - Malad West", slots: 3, status: "open", lat: 19.1860, lng: 72.8360, pricePerHour: 290 },
    { name: "Statiq - Lower Parel Phoenix", slots: 5, status: "open", lat: 18.9939, lng: 72.8256, pricePerHour: 360 },
    { name: "Ather Grid - Bandra West", slots: 2, status: "open", lat: 19.0596, lng: 72.8295, pricePerHour: 330 },
    { name: "Goregaon Express Hub", slots: 8, status: "open", lat: 19.1646, lng: 72.8493, pricePerHour: 260 },

    // ----------------------------------------------------
    // BENGALURU
    // ----------------------------------------------------
    { name: "Bescom Fast Charge - MG Road", slots: 5, status: "open", lat: 12.9738, lng: 77.6083, pricePerHour: 220 },
    { name: "Tata Power - Indiranagar", slots: 4, status: "open", lat: 12.9784, lng: 77.6408, pricePerHour: 260 },
    { name: "Zeon EV - Koramangala", slots: 6, status: "open", lat: 12.9279, lng: 77.6271, pricePerHour: 310 },
    { name: "Ather Grid - Whitefield", slots: 3, status: "under_work", lat: 12.9698, lng: 77.7499, pricePerHour: 275 },
    { name: "ChargeZone - Electronic City Phase 1", slots: 8, status: "open", lat: 12.8399, lng: 77.6770, pricePerHour: 300 },
    { name: "Jio-bp pulse - Jayanagar 4th Block", slots: 5, status: "open", lat: 12.9270, lng: 77.5855, pricePerHour: 250 },
    { name: "Statiq - Marathahalli Bridge", slots: 7, status: "open", lat: 12.9569, lng: 77.7011, pricePerHour: 280 },
    { name: "Tata Power - Bellandur ORR", slots: 6, status: "open", lat: 12.9304, lng: 77.6784, pricePerHour: 290 },
    { name: "EV Fast - Hebbal Flyover", slots: 4, status: "open", lat: 13.0354, lng: 77.5971, pricePerHour: 240 },
    { name: "Fortum - Yeshwanthpur Auto Hub", slots: 4, status: "open", lat: 13.0210, lng: 77.5401, pricePerHour: 260 },

    // ----------------------------------------------------
    // KERALA
    // ----------------------------------------------------
    { name: "KSEB EV Charging - Kochi High Court", slots: 3, status: "open", lat: 9.9816, lng: 76.2753, pricePerHour: 180 },
    { name: "Zeon EV - Trivandrum Central", slots: 5, status: "open", lat: 8.4988, lng: 76.9493, pricePerHour: 220 },
    { name: "Tata Power - Edappally Kochi", slots: 6, status: "open", lat: 10.0261, lng: 76.3125, pricePerHour: 240 },
    { name: "ChargeZone - Calicut Beach (Kozhikode)", slots: 4, status: "open", lat: 11.2588, lng: 75.7804, pricePerHour: 250 },
    { name: "Statiq - Thrissur Round", slots: 3, status: "open", lat: 10.5276, lng: 76.2144, pricePerHour: 230 },
    { name: "Jio-bp pulse - Palakkad NH", slots: 8, status: "open", lat: 10.7867, lng: 76.6548, pricePerHour: 260 },
    { name: "Ather Grid - Alappuzha City", slots: 2, status: "under_work", lat: 9.4981, lng: 76.3388, pricePerHour: 210 },
    { name: "KSEB EV - Kannur Thavakkara", slots: 4, status: "open", lat: 11.8745, lng: 75.3704, pricePerHour: 190 },

    // ----------------------------------------------------
    // CHENNAI
    // ----------------------------------------------------
    { name: "Zeon EV - OMR IT Expressway", slots: 8, status: "open", lat: 12.8837, lng: 80.2259, pricePerHour: 250 },
    { name: "Tata Power - T Nagar", slots: 4, status: "open", lat: 13.0418, lng: 80.2341, pricePerHour: 280 },
    { name: "ChargeZone - Chennai Airport", slots: 6, status: "open", lat: 12.9815, lng: 80.1632, pricePerHour: 350 },
    { name: "Statiq - Marina Beach Road", slots: 5, status: "open", lat: 13.0500, lng: 80.2824, pricePerHour: 260 },
    { name: "Jio-bp pulse - Guindy Industrial", slots: 7, status: "open", lat: 13.0067, lng: 80.2206, pricePerHour: 290 },
    { name: "Ather Grid - Velachery", slots: 3, status: "open", lat: 12.9750, lng: 80.2212, pricePerHour: 240 },
    { name: "Tata Power - Anna Nagar", slots: 4, status: "under_work", lat: 13.0850, lng: 80.2101, pricePerHour: 270 },
    { name: "EESL - Central Railway Hub Chennai", slots: 10, status: "open", lat: 13.0827, lng: 80.2707, pricePerHour: 200 }
  ];

  await Station.insertMany(stations);

  console.log(`✅ Successfully seeded ${stations.length} Highly Detailed Indian EV Stations into MongoDB!`);
  process.exit();
};

seedData();