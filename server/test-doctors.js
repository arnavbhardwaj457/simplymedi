const { Doctor, User, sequelize } = require('./models');

async function testAndSeedData() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    // Check for existing users
    const userCount = await User.count();
    console.log(`Users in database: ${userCount}`);
    
    // Check for existing doctors
    const doctorCount = await Doctor.count();
    console.log(`Doctors in database: ${doctorCount}`);
    
    // If no doctors exist, create some sample data
    if (doctorCount === 0) {
      console.log('No doctors found. Creating sample doctors...');
      
      // Create sample users for doctors
      const doctorUser1 = await User.create({
        firstName: 'John',
        lastName: 'Smith',
        email: 'dr.john.smith@hospital.com',
        password: 'hashedpassword123', // In real app, this would be properly hashed
        role: 'doctor',
        isActive: true
      });
      
      const doctorUser2 = await User.create({
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'dr.sarah.johnson@hospital.com',
        password: 'hashedpassword123',
        role: 'doctor',
        isActive: true
      });
      
      const doctorUser3 = await User.create({
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'dr.michael.brown@hospital.com',
        password: 'hashedpassword123',
        role: 'doctor',
        isActive: true
      });
      
      // Create doctor profiles
      await Doctor.create({
        userId: doctorUser1.id,
        specialization: 'Cardiology',
        qualifications: ['MD', 'FACC'],
        experience: 15,
        hospitalAffiliation: 'General Hospital',
        consultationFee: 200.00,
        averageRating: 4.8,
        totalReviews: 156,
        languages: ['English', 'Spanish'],
        bio: 'Experienced cardiologist with 15+ years of practice.',
        consultationTypes: ['online', 'in-person'],
        availability: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '15:00' }
        }
      });
      
      await Doctor.create({
        userId: doctorUser2.id,
        specialization: 'Dermatology',
        qualifications: ['MD', 'Dermatology Board Certified'],
        experience: 12,
        hospitalAffiliation: 'Skin Care Center',
        consultationFee: 150.00,
        averageRating: 4.9,
        totalReviews: 203,
        languages: ['English', 'French'],
        bio: 'Specialist in dermatological conditions and cosmetic procedures.',
        consultationTypes: ['online', 'in-person'],
        availability: {
          monday: { start: '10:00', end: '18:00' },
          tuesday: { start: '10:00', end: '18:00' },
          wednesday: { start: '10:00', end: '18:00' },
          thursday: { start: '10:00', end: '18:00' },
          friday: { start: '10:00', end: '16:00' }
        }
      });
      
      await Doctor.create({
        userId: doctorUser3.id,
        specialization: 'General',
        qualifications: ['MD', 'Family Medicine'],
        experience: 8,
        hospitalAffiliation: 'Community Health Center',
        consultationFee: 100.00,
        averageRating: 4.6,
        totalReviews: 89,
        languages: ['English'],
        bio: 'General practitioner focused on family medicine and preventive care.',
        consultationTypes: ['online', 'in-person', 'phone'],
        availability: {
          monday: { start: '08:00', end: '17:00' },
          tuesday: { start: '08:00', end: '17:00' },
          wednesday: { start: '08:00', end: '17:00' },
          thursday: { start: '08:00', end: '17:00' },
          friday: { start: '08:00', end: '17:00' }
        }
      });
      
      console.log('Sample doctors created successfully!');
    } else {
      console.log('Doctors already exist in database');
    }
    
    // Display all doctors
    const doctors = await Doctor.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });
    
    console.log('\nDoctors in database:');
    doctors.forEach(doctor => {
      console.log(`- Dr. ${doctor.user.firstName} ${doctor.user.lastName} (${doctor.specialization})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

testAndSeedData();