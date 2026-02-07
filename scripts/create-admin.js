
import prisma from '../api/_utils/prisma.js';
import bcrypt from 'bcryptjs';
import inquirer from 'inquirer';



async function main() {
    console.log("🔒 Creation d'un compte Administrateur sécurisé");

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'email',
            message: 'Email:',
            validate: (input) => input.includes('@') || "Email invalide"
        },
        {
            type: 'password',
            name: 'password',
            message: 'Mot de passe (min 8 car.):',
            validate: (input) => input.length >= 8 || "Le mot de passe doit faire au moins 8 caractères"
        },
        {
            type: 'list',
            name: 'role',
            message: 'Role:',
            choices: ['admin', 'super_admin', 'editor'],
            default: 'admin'
        }
    ]);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(answers.password, salt);

    try {
        const user = await prisma.adminUser.upsert({
            where: { email: answers.email },
            update: {
                password: hashedPassword,
                role: answers.role,
                failedLoginAttempts: 0,
                lockoutUntil: null
            },
            create: {
                email: answers.email,
                password: hashedPassword,
                role: answers.role
            },
        });

        console.log(`✅ Admin ${user.email} créé/mis à jour avec succès (ID: ${user.id})`);
    } catch (e) {
        console.error("❌ Erreur:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
