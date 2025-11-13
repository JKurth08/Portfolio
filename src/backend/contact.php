<?php
// src/backend/contact.php
mb_internal_encoding('UTF-8');

// CONFIG: set your destination address and optional from
$to      = 'jmkurth@mtu.edu';  // 
$from    = 'no-reply@yourdomain.com'; // domain you control (not the user's email)
$subject = 'New message from PortfolioOS contact form';

// Basic POST check
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

// Grab & sanitize
$name    = trim($_POST['name']    ?? '');
$email   = trim($_POST['email']   ?? '');
$company = trim($_POST['company'] ?? '');
$message = trim($_POST['message'] ?? '');
$trap    = trim($_POST['website'] ?? ''); // honeypot

// Honeypot or missing required fields
if ($trap !== '' || $name === '' || $email === '' || $message === '') {
    http_response_code(400);
    exit('Invalid submission');
}

// Block header injection in name/email
foreach ([$name, $email] as $v) {
    if (preg_match('/\r|\n/', $v)) {
        http_response_code(400);
        exit('Invalid characters');
    }
}

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    exit('Invalid email');
}

// Build email body
$lines = [
    "Name: $name",
    "Email: $email",
    $company !== '' ? "Company: $company" : null,
    "Message:",
    $message,
];
$body = implode("\n", array_filter($lines, fn($x) => $x !== null));

// Headers
$headers = [];
$headers[] = "From: $from";
$headers[] = "Reply-To: $email";
$headers[] = "MIME-Version: 1.0";
$headers[] = "Content-Type: text/plain; charset=UTF-8";
$headersStr = implode("\r\n", $headers);

// Send
$ok = mail($to, $subject, $body, $headersStr);

if ($ok) {
    // Simple success response; you can redirect back with a query param if you prefer
    echo 'Message sent. Thanks!';
} else {
    http_response_code(500);
    echo 'Failed to send. (Server mail() not configured?)';
}
