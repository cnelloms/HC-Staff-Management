-- Insert sample departments
INSERT INTO departments (name, description)
VALUES 
  ('Human Resources', 'HR department responsible for personnel management'),
  ('Information Technology', 'IT department handling technical systems'),
  ('Finance', 'Finance department managing company finances'),
  ('Operations', 'Operations department overseeing daily activities'),
  ('Clinical Staff', 'Medical professionals providing patient care');

-- Insert sample employees
INSERT INTO employees (first_name, last_name, email, phone, position, department_id, hire_date, status, avatar)
VALUES
  ('Sarah', 'Johnson', 'sarah.johnson@example.com', '555-123-4567', 'HR Administrator', 1, current_timestamp, 'active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('Michael', 'Foster', 'michael.foster@example.com', '555-987-6543', 'IT Specialist', 2, current_timestamp, 'active', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('Robert', 'Johnson', 'robert.johnson@example.com', '555-234-5678', 'Financial Analyst', 3, current_timestamp, 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('Sarah', 'Taylor', 'sarah.taylor@example.com', '555-345-6789', 'Nurse Practitioner', 5, current_timestamp, 'onboarding', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('Tom', 'Wilson', 'tom.wilson@example.com', '555-456-7890', 'Operations Manager', 4, current_timestamp, 'active', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80');

-- Insert sample systems
INSERT INTO systems (name, description, category)
VALUES
  ('Electronic Health Records (EHR)', 'Clinical documentation system', 'clinical'),
  ('Financial Management', 'Accounting and billing', 'finance'),
  ('Scheduling System', 'Appointment management', 'operations'),
  ('Learning Management System', 'Staff training platform', 'hr');