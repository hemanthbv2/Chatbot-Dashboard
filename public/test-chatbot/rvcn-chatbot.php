<?php
/**
 * Plugin Name: RVCN Chatbot
 * Description: Premium conversational chatbot for RV College of Nursing, helping visitors inquire about admissions, HOD directories, hostel fees, and programs. Includes a configuration settings dashboard.
 * Version: 1.0.0
 * Author: RVCN Developer
 * License: GPL-2.0+
 * Text Domain: rvcn-chatbot
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
	exit;
}

// Define Constants
define( 'RVCN_CHATBOT_VERSION', '2.1.0' );
define('RVCN_CHATBOT_DIR_PATH', plugin_dir_path(__FILE__));
define('RVCN_CHATBOT_DIR_URL', plugin_dir_url(__FILE__));

/**
 * Register Settings Page in WordPress Admin Dashboard
 */
function rvcn_chatbot_add_admin_menu()
{
	add_menu_page(
		__('RVCN Chatbot Settings', 'rvcn-chatbot'),
		__('RVCN Chatbot', 'rvcn-chatbot'),
		'manage_options',
		'rvcn-chatbot',
		'rvcn_chatbot_settings_page',
		'dashicons-format-chat',
		100
	);

	add_submenu_page(
		'rvcn-chatbot',
		__( 'Analytics Dashboard', 'rvcn-chatbot' ),
		__( 'Analytics Dashboard', 'rvcn-chatbot' ),
		'manage_options',
		'rvcn-chatbot-dashboard',
		'rvcn_chatbot_analytics_dashboard_page'
	);
}
add_action( 'admin_menu', 'rvcn_chatbot_add_admin_menu' );

/**
 * Render the Analytics Dashboard Page via iframe
 */
function rvcn_chatbot_analytics_dashboard_page() {
	$dashboard_url = admin_url( 'admin-post.php?action=rvcn_chatbot_dashboard_view&tab=index' );
	?>
	<div class="wrap" style="margin: 0; padding: 0; max-width: 100%; height: calc(100vh - 32px);">
		<iframe src="<?php echo esc_url($dashboard_url); ?>" style="width: 100%; height: 100%; border: none;"></iframe>
	</div>
	<?php
}

/**
 * Handle Secure Admin-Post Routing for Dashboard Tabs
 */
function rvcn_chatbot_render_dashboard_tab() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Unauthorized' );
	}

	$tab = isset( $_GET['tab'] ) ? sanitize_text_field( $_GET['tab'] ) : 'index';
	$allowed_tabs = array( 'index', 'interactions', 'sessions', 'leads', 'analytics', 'login' );

	if ( ! in_array( $tab, $allowed_tabs ) ) {
		wp_die( 'Invalid dashboard tab requested.' );
	}

	$file_path = RVCN_CHATBOT_DIR_PATH . 'dashboard/' . $tab . '.php';

	if ( file_exists( $file_path ) ) {
		include $file_path;
	} else {
		wp_die( 'Dashboard file not found.' );
	}
	exit;
}
add_action( 'admin_post_rvcn_chatbot_dashboard_view', 'rvcn_chatbot_render_dashboard_tab' );

/**
 * Register settings and sanitization
 */
function rvcn_chatbot_register_settings()
{
	register_setting('rvcn_chatbot_options_group', 'rvcn_chatbot_enabled', array('sanitize_callback' => 'sanitize_text_field'));
	register_setting('rvcn_chatbot_options_group', 'rvcn_chatbot_title', array('sanitize_callback' => 'sanitize_text_field'));
	register_setting('rvcn_chatbot_options_group', 'rvcn_chatbot_status_text', array('sanitize_callback' => 'sanitize_text_field'));
	register_setting('rvcn_chatbot_options_group', 'rvcn_chatbot_welcome_text', array('sanitize_callback' => 'sanitize_textarea_field'));
	register_setting('rvcn_chatbot_options_group', 'rvcn_chatbot_api_url', array('sanitize_callback' => 'esc_url_raw'));
	register_setting('rvcn_chatbot_options_group', 'rvcn_chatbot_vercel_url', array('sanitize_callback' => 'esc_url_raw'));
	register_setting('rvcn_chatbot_options_group', 'rvcn_chatbot_sheets_url', array('sanitize_callback' => 'esc_url_raw'));
	register_setting('rvcn_chatbot_options_group', 'rvcn_chatbot_logo_url', array('sanitize_callback' => 'esc_url_raw'));
	register_setting('rvcn_chatbot_options_group', 'rvcn_chatbot_receiver_email', array('sanitize_callback' => 'sanitize_email'));
	register_setting('rvcn_chatbot_options_group', 'rvcn_chatbot_sender_email', array('sanitize_callback' => 'sanitize_email'));
}
add_action('admin_init', 'rvcn_chatbot_register_settings');

/**
 * Settings Page HTML Rendering
 */
function rvcn_chatbot_settings_page()
{
	?>
	<div class="wrap">
		<h1><?php echo esc_html(__('RVCN Chatbot Settings Dashboard', 'rvcn-chatbot')); ?></h1>
		<p><?php echo esc_html(__('Manage and customize your RV College of Nursing Chatbot frontend display, behaviors, and integrations.', 'rvcn-chatbot')); ?>
		</p>

		<hr />

		<form method="post" action="options.php"
			style="max-width: 800px; background: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-top: 20px;">
			<?php settings_fields('rvcn_chatbot_options_group'); ?>
			<?php do_settings_sections('rvcn_chatbot_options_group'); ?>

			<table class="form-table" style="width: 100%;">

				<!-- Enabled / Disabled Option -->
				<tr valign="top">
					<th scope="row" style="width: 200px; font-weight: bold;">
						<?php _e('Enable Chatbot', 'rvcn-chatbot'); ?></th>
					<td>
						<label class="switch">
							<input type="checkbox" name="rvcn_chatbot_enabled" value="1" <?php checked('1', get_option('rvcn_chatbot_enabled', '1')); ?> />
							<span><?php _e('Display the chatbot on the website frontend.', 'rvcn-chatbot'); ?></span>
						</label>
					</td>
				</tr>

				<!-- Chatbot Header Title -->
				<tr valign="top">
					<th scope="row" style="font-weight: bold;"><?php _e('Chatbot Header Title', 'rvcn-chatbot'); ?></th>
					<td>
						<input type="text" name="rvcn_chatbot_title"
							value="<?php echo esc_attr(get_option('rvcn_chatbot_title', 'RV College of Nursing')); ?>"
							class="regular-text" style="width: 100%; max-width: 450px;" required />
						<p class="description">
							<?php _e('Header title shown at the top of the chatbot container.', 'rvcn-chatbot'); ?></p>
					</td>
				</tr>

				<!-- Chatbot Status Text -->
				<tr valign="top">
					<th scope="row" style="font-weight: bold;"><?php _e('Status Message', 'rvcn-chatbot'); ?></th>
					<td>
						<input type="text" name="rvcn_chatbot_status_text"
							value="<?php echo esc_attr(get_option('rvcn_chatbot_status_text', 'Online - Ready to help')); ?>"
							class="regular-text" style="width: 100%; max-width: 450px;" required />
						<p class="description">
							<?php _e('Sub-heading status text under the title (e.g., Online - Ready to help).', 'rvcn-chatbot'); ?>
						</p>
					</td>
				</tr>

				<!-- Welcome Tooltip Text -->
				<tr valign="top">
					<th scope="row" style="font-weight: bold;"><?php _e('Welcome Prompt Text', 'rvcn-chatbot'); ?></th>
					<td>
						<textarea name="rvcn_chatbot_welcome_text" rows="3" class="large-text"
							style="width: 100%; max-width: 450px;"
							required><?php echo esc_textarea(get_option('rvcn_chatbot_welcome_text', 'Hi there! Need help with admissions at RVCN? Chat with us!')); ?></textarea>
						<p class="description">
							<?php _e('The tooltip teaser message displayed above the toggle launcher button.', 'rvcn-chatbot'); ?>
						</p>
					</td>
				</tr>

				<!-- Vercel Backend URL (MongoDB / External Dashboard) -->
				<tr valign="top">
					<th scope="row" style="font-weight: bold;"><?php _e('Vercel Backend URL', 'rvcn-chatbot'); ?></th>
					<td>
						<input type="url" name="rvcn_chatbot_vercel_url"
							value="<?php echo esc_url(get_option('rvcn_chatbot_vercel_url', '')); ?>"
							class="regular-text" style="width: 100%; max-width: 450px;"
							placeholder="https://your-app.vercel.app" />
						<p class="description"><?php _e('Your Vercel Node.js backend URL (without /api). Telemetry will ALSO be sent here → saved to MongoDB → shown in your external dashboard.', 'rvcn-chatbot'); ?></p>
					</td>
				</tr>

				<!-- Google Sheets API URL -->
				<tr valign="top">
					<th scope="row" style="font-weight: bold;"><?php _e('Google Sheets Web App URL', 'rvcn-chatbot'); ?>
					</th>
					<td>
						<input type="url" name="rvcn_chatbot_sheets_url"
							value="<?php echo esc_url(get_option('rvcn_chatbot_sheets_url', 'https://script.google.com/macros/s/AKfycbweu2IVU6J23Dh9_nai5EmwFsjipR3HJmSMSh5ROOk-jcznWhha1Ng2c6WdizFWtYmA/exec')); ?>"
							class="regular-text" style="width: 100%; max-width: 450px;" />
						<p class="description">
							<?php _e('Optional Google Apps Script endpoint URL where lead form submissions are forwarded.', 'rvcn-chatbot'); ?>
						</p>
					</td>
				</tr>

				<!-- Custom Logo URL -->
				<tr valign="top">
					<th scope="row" style="font-weight: bold;"><?php _e('Custom Logo Image URL', 'rvcn-chatbot'); ?></th>
					<td>
						<input type="url" name="rvcn_chatbot_logo_url" id="rvcn_chatbot_logo_url"
							value="<?php echo esc_url(trim(get_option('rvcn_chatbot_logo_url', '')) ? trim(get_option('rvcn_chatbot_logo_url', '')) : 'https://rvcn.edu.in/wp-content/uploads/2026/07/logo.png'); ?>"
							class="regular-text" style="width: 100%; max-width: 450px;" />
						<p class="description">
							<?php _e('URL of the logo image shown inside the chatbot header and bot messages. Leave default to use RVEI Logo.', 'rvcn-chatbot'); ?>
						</p>
					</td>
				</tr>

				<!-- Receiver Email -->
				<tr valign="top">
					<th scope="row" style="font-weight: bold;"><?php _e('Lead Receiver Email', 'rvcn-chatbot'); ?></th>
					<td>
						<input type="email" name="rvcn_chatbot_receiver_email"
							value="<?php echo esc_attr(get_option('rvcn_chatbot_receiver_email', 'connect.rvcn@rvei.edu.in')); ?>"
							class="regular-text" style="width: 100%; max-width: 450px;" required />
						<p class="description">
							<?php _e('Email address where all chatbot lead notifications will be sent.', 'rvcn-chatbot'); ?>
						</p>
					</td>
				</tr>

				<!-- Sender Email -->
				<tr valign="top">
					<th scope="row" style="font-weight: bold;"><?php _e('Sender Email (From)', 'rvcn-chatbot'); ?></th>
					<td>
						<input type="email" name="rvcn_chatbot_sender_email"
							value="<?php echo esc_attr(get_option('rvcn_chatbot_sender_email', 'leads.rvcn@rvei.edu.in')); ?>"
							class="regular-text" style="width: 100%; max-width: 450px;" required />
						<p class="description">
							<?php _e('Email address used as the "From" address in lead notification emails.', 'rvcn-chatbot'); ?>
						</p>
					</td>
				</tr>

			</table>

			<?php submit_button(__('Save Chatbot Settings', 'rvcn-chatbot'), 'primary', 'submit', true, array('style' => 'margin-top: 20px;')); ?>
		</form>
	</div>
	<?php
}

/**
 * Enqueue styles and scripts for the frontend site
 */
function rvcn_chatbot_enqueue_assets()
{
	// Only load if the chatbot is enabled
	if (get_option('rvcn_chatbot_enabled', '1') !== '1') {
		return;
	}

	// Enqueue main stylesheet
	wp_enqueue_style(
		'rvcn-chatbot-style',
		RVCN_CHATBOT_DIR_URL . 'style.css',
		array(),
		RVCN_CHATBOT_VERSION
	);

	// Enqueue Chatbot Data (KB definitions)
	wp_enqueue_script(
		'rvcn-chatbot-data',
		RVCN_CHATBOT_DIR_URL . 'chatbot-data.js',
		array(),
		RVCN_CHATBOT_VERSION,
		true
	);

	// Enqueue Telemetry Engine
	wp_enqueue_script(
		'rvcn-chatbot-telemetry',
		RVCN_CHATBOT_DIR_URL . 'telemetry.js',
		array(),
		RVCN_CHATBOT_VERSION,
		true
	);

	// Enqueue Chatbot Core Engine
	wp_enqueue_script(
		'rvcn-chatbot-script',
		RVCN_CHATBOT_DIR_URL . 'script.js',
		array('rvcn-chatbot-data', 'rvcn-chatbot-telemetry'),
		RVCN_CHATBOT_VERSION,
		true
	);

	// Localize script to pass WordPress admin values to frontend Javascript
	wp_localize_script(
		'rvcn-chatbot-script',
		'rvcnChatbotSettings',
		array(
			'logoUrl'        => esc_url(trim(get_option('rvcn_chatbot_logo_url', '')) ? trim(get_option('rvcn_chatbot_logo_url', '')) : 'https://rvcn.edu.in/wp-content/uploads/2026/07/logo.png'),
			'title'          => esc_html(get_option('rvcn_chatbot_title', 'RV College of Nursing')),
			'statusText'     => esc_html(get_option('rvcn_chatbot_status_text', 'Online - Ready to help')),
			'welcomeText'    => esc_html(get_option('rvcn_chatbot_welcome_text', 'Hi there! Need help with admissions at RVCN? Chat with us!')),
			'googleSheetsUrl'=> esc_url_raw(get_option('rvcn_chatbot_sheets_url', 'https://script.google.com/macros/s/AKfycbweu2IVU6J23Dh9_nai5EmwFsjipR3HJmSMSh5ROOk-jcznWhha1Ng2c6WdizFWtYmA/exec')),
			'restUrl'        => esc_url_raw(rest_url('rvcn/v1')),           // WP REST → MySQL → WP Dashboard
			'vercelUrl'      => esc_url_raw(get_option('rvcn_chatbot_vercel_url', '')), // Vercel → MongoDB → External Dashboard
			'ajaxUrl'        => admin_url('admin-ajax.php'),
			'nonce'          => wp_create_nonce('rvcn_chatbot_nonce')
		)
	);
}
add_action('wp_enqueue_scripts', 'rvcn_chatbot_enqueue_assets');

/**
 * Inject Chatbot Markup into the Page Footer
 */
function rvcn_chatbot_render_footer_html()
{
	// Only render if enabled
	if (get_option('rvcn_chatbot_enabled', '1') !== '1') {
		return;
	}

	$logo_url = esc_url(trim(get_option('rvcn_chatbot_logo_url', '')) ? trim(get_option('rvcn_chatbot_logo_url', '')) : 'https://rvcn.edu.in/wp-content/uploads/2026/07/logo.png');
	$title = esc_html(get_option('rvcn_chatbot_title', 'RV College of Nursing'));
	$status_text = esc_html(get_option('rvcn_chatbot_status_text', 'Online - Ready to help'));
	$welcome = esc_html(get_option('rvcn_chatbot_welcome_text', 'Hi there! Need help with admissions at RVCN? Chat with us!'));
	?>
	<!-- Welcome Prompt Tooltip -->
	<div class="welcome-prompt hidden" id="welcomePrompt" role="alert">
		<div class="welcome-prompt-avatar" aria-hidden="true">👋</div>
		<div class="welcome-prompt-text">
			<strong><?php _e('Hi there!', 'rvcn-chatbot'); ?></strong> <?php echo $welcome; ?>
		</div>
		<button class="welcome-prompt-close" id="welcomePromptClose"
			aria-label="<?php esc_attr_e('Dismiss prompt', 'rvcn-chatbot'); ?>" type="button">✕</button>
	</div>

	<!-- Chat Toggle Button -->
	<button class="chat-toggle" id="chatToggle" aria-label="<?php esc_attr_e('Open chat', 'rvcn-chatbot'); ?>"
		type="button">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
			stroke-linejoin="round">
			<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
		</svg>
		<span class="badge" aria-hidden="true">1</span>
	</button>

	<!-- Chat Window -->
	<div class="chat-container" id="chatContainer" role="dialog"
		aria-label="<?php esc_attr_e('RVCN Chatbot', 'rvcn-chatbot'); ?>">

		<!-- Header -->
		<header class="chat-header">
			<div class="chat-logo" aria-hidden="true">
				<img src="<?php echo $logo_url; ?>" alt="<?php echo esc_attr($title); ?> Logo" onerror="this.onerror=null;this.src='https://rvcn.edu.in/wp-content/uploads/2026/07/logo.png';"
					style="width: 100%; height: 100%; object-fit: contain;">
			</div>
			<div class="chat-header-info">
				<div class="chat-header-title"><?php echo $title; ?></div>
				<div class="chat-header-status">
					<span class="status-dot" aria-hidden="true"></span>
					<?php echo $status_text; ?>
				</div>
			</div>
			<button class="chat-clear-btn" id="chatClearBtn"
				aria-label="<?php esc_attr_e('Clear chat', 'rvcn-chatbot'); ?>" type="button"
				title="<?php esc_attr_e('Clear chat', 'rvcn-chatbot'); ?>">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
					stroke-linejoin="round">
					<polyline points="1 4 1 10 7 10"></polyline>
					<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
				</svg>
			</button>
			<button class="chat-close-btn" id="chatCloseBtn"
				aria-label="<?php esc_attr_e('Close chat', 'rvcn-chatbot'); ?>" type="button">✕</button>
		</header>

		<!-- Messages -->
		<div class="chat-messages" id="chatMessages" role="log" aria-live="polite"
			aria-label="<?php esc_attr_e('Chat messages', 'rvcn-chatbot'); ?>">
			<!-- Messages will be dynamically inserted here -->
		</div>

		<!-- Input Area -->
		<div class="chat-input-area">
			<input type="text" class="chat-input" id="chatInput"
				placeholder="<?php esc_attr_e('Type a message or click a button...', 'rvcn-chatbot'); ?>"
				autocomplete="off" aria-label="<?php esc_attr_e('Type your message', 'rvcn-chatbot'); ?>">
			<button class="chat-send-btn" id="chatSendBtn"
				aria-label="<?php esc_attr_e('Send message', 'rvcn-chatbot'); ?>" type="button">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
					stroke-linejoin="round">
					<line x1="22" y1="2" x2="11" y2="13"></line>
					<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
				</svg>
			</button>
		</div>

	</div>
	<?php
}
add_action('wp_footer', 'rvcn_chatbot_render_footer_html');

/**
 * AJAX Handler: Send Lead Email via wp_mail()
 */
function rvcn_chatbot_send_lead_email()
{
	// Verify nonce
	if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'rvcn_chatbot_nonce')) {
		wp_send_json_error(array('message' => 'Security check failed.'), 403);
	}

	$form_type = sanitize_text_field(isset($_POST['formType']) ? $_POST['formType'] : 'General Inquiry');
	$name = sanitize_text_field(isset($_POST['name']) ? $_POST['name'] : 'Not provided');
	$phone = sanitize_text_field(isset($_POST['phone']) ? $_POST['phone'] : 'Not provided');
	$email = sanitize_email(isset($_POST['email']) ? $_POST['email'] : '');
	$time_slot = sanitize_text_field(isset($_POST['timeSlot']) ? $_POST['timeSlot'] : '');
	$city = sanitize_text_field(isset($_POST['city']) ? $_POST['city'] : '');
	$percentage = sanitize_text_field(isset($_POST['percentage']) ? $_POST['percentage'] : '');
	$specialization = sanitize_text_field(isset($_POST['specialization']) ? $_POST['specialization'] : '');
	$programme = sanitize_text_field(isset($_POST['programme']) ? $_POST['programme'] : '');
	$category = sanitize_text_field(isset($_POST['category']) ? $_POST['category'] : '');

	// Build email HTML
	$email_html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">';
	$email_html .= '<h2 style="color: #004b8d; text-align: center; border-bottom: 2px solid #e31e24; padding-bottom: 10px;">New RVCN Lead Generated</h2>';
	$email_html .= '<div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px;">';
	$email_html .= '<p><strong>Lead Type:</strong> <span style="color: #555;">' . esc_html($form_type) . '</span></p>';
	$email_html .= '<p><strong>Name:</strong> <span style="color: #555;">' . esc_html($name) . '</span></p>';
	$email_html .= '<p><strong>Phone:</strong> <span style="color: #555;">' . esc_html($phone) . '</span></p>';

	if ($email)
		$email_html .= '<p><strong>Email:</strong> <span style="color: #555;">' . esc_html($email) . '</span></p>';
	if ($time_slot)
		$email_html .= '<p><strong>Time:</strong> <span style="color: #555;">' . esc_html($time_slot) . '</span></p>';
	if ($city)
		$email_html .= '<p><strong>City:</strong> <span style="color: #555;">' . esc_html($city) . '</span></p>';
	if ($percentage)
		$email_html .= '<p><strong>12th Percentage:</strong> <span style="color: #555;">' . esc_html($percentage) . '%</span></p>';
	if ($specialization)
		$email_html .= '<p><strong>Specialization:</strong> <span style="color: #555;">' . esc_html($specialization) . '</span></p>';
	if ($programme)
		$email_html .= '<p><strong>Programme:</strong> <span style="color: #555;">' . esc_html($programme) . '</span></p>';
	if ($category)
		$email_html .= '<p><strong>Category:</strong> <span style="color: #555;">' . esc_html($category) . '</span></p>';

	$email_html .= '</div>';
	$email_html .= '<p style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">This email was automatically generated by the RVCN Chatbot.</p>';
	$email_html .= '</div>';

	$receiver_email = get_option('rvcn_chatbot_receiver_email', 'connect.rvcn@rvei.edu.in');
	$sender_email = get_option('rvcn_chatbot_sender_email', 'leads.rvcn@rvei.edu.in');
	$subject = 'RVCN Lead: ' . $form_type;
	$headers = array(
		'Content-Type: text/html; charset=UTF-8',
		'From: RVCN Chatbot <' . $sender_email . '>'
	);

	$sent = wp_mail($receiver_email, $subject, $email_html, $headers);

	if ($sent) {
		wp_send_json_success(array('message' => 'Lead sent to email successfully.'));
	} else {
		wp_send_json_error(array('message' => 'Failed to send lead email.'), 500);
	}
}
add_action('wp_ajax_rvcn_send_lead', 'rvcn_chatbot_send_lead_email');
add_action('wp_ajax_nopriv_rvcn_send_lead', 'rvcn_chatbot_send_lead_email');

/**
 * Fix for AWS/cPanel "certificate verify failed" SMTP Error
 * Bypasses strict SSL verification for PHPMailer & WP Mail SMTP.
 */
add_action('phpmailer_init', 'rvcn_fix_smtp_ssl_verify', 999);
function rvcn_fix_smtp_ssl_verify($phpmailer)
{
	$phpmailer->SMTPOptions = array(
		'ssl' => array(
			'verify_peer' => false,
			'verify_peer_name' => false,
			'allow_self_signed' => true
		)
	);
}

add_filter('wp_mail_smtp_custom_options', 'rvcn_wp_mail_smtp_fix');
function rvcn_wp_mail_smtp_fix($phpmailer)
{
	$phpmailer->SMTPOptions = array(
		'ssl' => array(
			'verify_peer' => false,
			'verify_peer_name' => false,
			'allow_self_signed' => true
		)
	);
	return $phpmailer;
}

// === Native WordPress Backend Implementation ===
add_action('rest_api_init', function () {
    $namespace = 'rvcn/v1';
    
    // POST /logs
    register_rest_route($namespace, '/logs', array(
        'methods' => 'POST',
        'callback' => 'rvcn_chatbot_post_logs',
        'permission_callback' => '__return_true' // Public for frontend telemetry
    ));

    // GET endpoints for Dashboard
    $dashboard_routes = array('/overview-data', '/interactions-data', '/sessions-data', '/analytics-data');
    foreach ($dashboard_routes as $route) {
        register_rest_route($namespace, $route, array(
            'methods' => 'GET',
            'callback' => 'rvcn_chatbot_get_interactions',
            'permission_callback' => '__return_true'
        ));
    }

    // GET /leads-data
    register_rest_route($namespace, '/leads-data', array(
        'methods' => 'GET',
        'callback' => 'rvcn_chatbot_get_leads',
        'permission_callback' => '__return_true'
    ));
});

function rvcn_chatbot_post_logs($request) {
    rvcn_chatbot_ensure_tables_exist();
    global $wpdb;
    $params = $request->get_params();
    $session_id = isset($params['sessionId']) ? sanitize_text_field($params['sessionId']) : '';
    $events = isset($params['events']) ? $params['events'] : array();

    if (empty($session_id) || empty($events)) {
        return new WP_Error('invalid_data', 'No events provided', array('status' => 400));
    }

    $table_interactions = $wpdb->prefix . 'rvcn_interactions';
    $table_leads = $wpdb->prefix . 'rvcn_leads';

    foreach ($events as $e) {
        $event_type = isset($e['eventType']) ? sanitize_text_field($e['eventType']) : 'unknown';
        $data = isset($e['data']) ? $e['data'] : array();

        // Auto-detect leads from form_submit OR freeform chat text containing email/phone
        $is_lead = ($event_type === 'form_submit');
        $extracted_email = '';
        $extracted_phone = '';

        $text_to_scan = wp_json_encode($data);
        if (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text_to_scan, $matches)) {
            $extracted_email = $matches[0];
            $is_lead = true;
        }
        if (preg_match('/[0-9]{10}/', $text_to_scan, $matches)) {
            $extracted_phone = $matches[0];
            $is_lead = true;
        }

        if ($is_lead) {
            // For form_submit events, data is wrapped as { leadData: {...} }
            // For chat-detected leads, data is the direct object
            $lead_payload = isset($data['leadData']) ? $data['leadData'] : $data;
            if (!isset($lead_payload['email']) && $extracted_email) $lead_payload['email'] = $extracted_email;
            if (!isset($lead_payload['phone']) && $extracted_phone) $lead_payload['phone'] = $extracted_phone;
            if (!isset($lead_payload['name'])) {
                if (preg_match('/(?:Name|Full Name)[\:\s]+([a-zA-Z\s]+)(?:Phone|Email|$)/i', $text_to_scan, $n_matches)) {
                    $lead_payload['name'] = trim($n_matches[1]);
                } else {
                    $lead_payload['name'] = 'Chat Visitor';
                }
            }
            if (!isset($lead_payload['formType'])) $lead_payload['formType'] = 'Chat Lead';

            $wpdb->insert($table_leads, array(
                'session_id' => $session_id,
                'lead_data' => wp_json_encode($lead_payload),
                'created_at' => current_time('mysql', 1)
            ));
        }

        // Log all events as interactions
        $interactionId = $event_type;
        if ($event_type === 'message') {
            $interactionId = isset($data['intent']) ? sanitize_text_field($data['intent']) : 'unknown';
        } else if (in_array($event_type, array('click', 'hover', 'copy', 'dwell', 'scroll'))) {
            $elementId = isset($data['elementId']) ? sanitize_text_field($data['elementId']) : '';
            $interactionId = $event_type . ':' . $elementId;
        }
        
        $queryText = isset($data['elementText']) ? sanitize_text_field($data['elementText']) : (isset($data['query']) ? sanitize_text_field($data['query']) : '');
        if (!$queryText) {
            if ($event_type === 'heartbeat') $queryText = 'User active on page (Dwell: ' . (isset($data['dwellTimeSeconds']) ? intval($data['dwellTimeSeconds']) : 0) . 's)';
            else if ($event_type === 'page_load') $queryText = 'Opened Chatbot';
            else if ($event_type === 'scroll') $queryText = 'Scrolled down page';
            else if ($event_type === 'copy') $queryText = 'Copied text to clipboard';
            else $queryText = $event_type;
        }

        $wpdb->insert($table_interactions, array(
            'session_id' => $session_id,
            'event_type' => $event_type,
            'interaction_id' => $interactionId,
            'query_text' => $queryText,
            'meta_data' => wp_json_encode($data),
            'created_at' => current_time('mysql', 1)
        ));
    }
    
    return rest_ensure_response(array('success' => true, 'message' => 'Logs saved natively'));
}

function rvcn_chatbot_get_interactions($request) {
    rvcn_chatbot_ensure_tables_exist();
    global $wpdb;
    $table_name = $wpdb->prefix . 'rvcn_interactions';
    
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) return rest_ensure_response(array());

    $results = $wpdb->get_results("SELECT * FROM $table_name ORDER BY created_at DESC LIMIT 5000", ARRAY_A);
    
    $formatted = array();
    foreach ($results as $row) {
        $formatted[] = array(
            's' => $row['session_id'],
            'd' => $row['created_at'],
            't' => ($row['event_type'] === 'message') ? 'message' : (($row['event_type'] === 'page_load') ? 'session' : 'interaction'),
            'i' => $row['interaction_id'],
            'q' => $row['query_text'],
            'm' => json_decode($row['meta_data'], true)
        );
    }
    return rest_ensure_response($formatted);
}

function rvcn_chatbot_get_leads($request) {
    rvcn_chatbot_ensure_tables_exist();
    global $wpdb;
    $table_name = $wpdb->prefix . 'rvcn_leads';
    
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) return rest_ensure_response(array());

    $results = $wpdb->get_results("SELECT * FROM $table_name ORDER BY created_at DESC LIMIT 500", ARRAY_A);
    
    $formatted = array();
    foreach ($results as $row) {
        $formatted[] = array(
            'sessionId' => $row['session_id'],
            'timestamp' => $row['created_at'],
            'data' => json_decode($row['lead_data'], true)
        );
    }
    return rest_ensure_response($formatted);
}

function rvcn_chatbot_activate() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();

    $table_interactions = $wpdb->prefix . 'rvcn_interactions';
    $table_leads = $wpdb->prefix . 'rvcn_leads';

    $sql_interactions = "CREATE TABLE $table_interactions (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        session_id varchar(100) NOT NULL,
        event_type varchar(100) NOT NULL,
        interaction_id varchar(255) DEFAULT '',
        query_text text,
        meta_data longtext,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id)
    ) $charset_collate;";

    $sql_leads = "CREATE TABLE $table_leads (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        session_id varchar(100) NOT NULL,
        lead_data longtext,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql_interactions);
    dbDelta($sql_leads);
}
register_activation_hook(__FILE__, 'rvcn_chatbot_activate');


function rvcn_chatbot_ensure_tables_exist() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();

    $table_interactions = $wpdb->prefix . 'rvcn_interactions';
    $table_leads = $wpdb->prefix . 'rvcn_leads';

    if ($wpdb->get_var("SHOW TABLES LIKE '$table_interactions'") !== $table_interactions) {
        $sql_interactions = "CREATE TABLE $table_interactions (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            session_id varchar(100) NOT NULL,
            event_type varchar(100) NOT NULL,
            interaction_id varchar(255) DEFAULT '',
            query_text text,
            meta_data longtext,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_interactions);
    }

    if ($wpdb->get_var("SHOW TABLES LIKE '$table_leads'") !== $table_leads) {
        $sql_leads = "CREATE TABLE $table_leads (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            session_id varchar(100) NOT NULL,
            lead_data longtext,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_leads);
    }
}
