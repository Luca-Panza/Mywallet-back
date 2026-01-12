import { faker } from '@faker-js/faker';

export function generateUser() {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 8 })
  };
}

export function generateTransaction(type = 'income') {
  return {
    description: faker.commerce.productName(),
    amount: parseFloat(faker.finance.amount({ min: 10, max: 1000, dec: 2 }))
  };
}

export function generateCategory(type = 'income') {
  const categories = {
    income: ['Salário', 'Freelance', 'Investimentos', 'Prêmio', 'Bônus'],
    expense: ['Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer']
  };

  return {
    name: faker.helpers.arrayElement(categories[type]),
    type: type,
    icon: faker.helpers.arrayElement(['💰', '💵', '💳', '🏦', '📊', '🍔', '🚗', '🏥', '📚', '🎮']),
    description: faker.lorem.sentence()
  };
}
