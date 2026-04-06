# SyllabeaseV2-React-JS-with-Django
SyllabeaseV2 but with completely different tech stack using Vite React JS Typescript w/ Flowbite &amp;&amp; Django Framework

HOW TO INITIALIZE PROJECT:
Terminal 1:
Run cd backend > python manage.py makemigrations > python manage.py migrate
(go to root directory) Run pip install -r requirements.txt
Run cd backend > python manage.py seed_orgs (To seed Colleges, Departments and Programs)
Run python manage.py seed_roles (To seed Roles (e.g. DEAN, CHAIRPERSON, AUDITOR, etc.))
Run python manage.py seed_templates (To seed Syllabus and Review Form Templates)

Terminal 2:
Run cd frontend > npm install


HOW TO CREATE AN ADMIN SUPERUSER:
Terminal 1:
Run cd backend > python manage.py runserver 
Terminal 2:
Run cd backend > python manage.py createsuperuser > Follow on prompt instructions > Visit localhost:8000/admin/ > login superuser > navigate to UserRoles > edit UserRoles of user to have Admin Role


HOW TO APPLY DATABASE CHANGES THROUGH DJANGO:
(First, truncate database tables if Database Administrator says so)
Terminal 1:
Run cd backend > python manage.py makemigrations > python manage.py migrate


HOW TO START SYSTEM:
Django Backend (Terminal 1):
Run cd backend > python manage.py runserver
React Frontend (Terminal 2):
Run cd frontend > npm run dev
