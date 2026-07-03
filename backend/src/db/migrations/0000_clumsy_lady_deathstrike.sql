CREATE TABLE `institutions` (
	`id` text PRIMARY KEY NOT NULL,
	`onchain_id` text NOT NULL,
	`name` text NOT NULL,
	`legal_name` text,
	`category` text DEFAULT 'school' NOT NULL,
	`kyb_status` text DEFAULT 'pending' NOT NULL,
	`stellar_address` text NOT NULL,
	`bank_account_hash` text NOT NULL,
	`location` text,
	`country` text DEFAULT 'PK' NOT NULL,
	`contact_email` text,
	`contact_phone` text,
	`registered_at` integer DEFAULT (unixepoch()) NOT NULL,
	`verified_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `institutions_onchain_id_idx` ON `institutions` (`onchain_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `institutions_stellar_address_idx` ON `institutions` (`stellar_address`);--> statement-breakpoint
CREATE INDEX `institutions_status_idx` ON `institutions` (`kyb_status`);--> statement-breakpoint
CREATE INDEX `institutions_category_idx` ON `institutions` (`category`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`onchain_escrow_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`sender_address` text NOT NULL,
	`institution_id` text NOT NULL,
	`institution_address` text NOT NULL,
	`token_address` text NOT NULL,
	`amount` text NOT NULL,
	`purpose` text DEFAULT 'school_fees' NOT NULL,
	`reference` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`timeout_seconds` integer NOT NULL,
	`timeout_at` integer NOT NULL,
	`proof_hash` text,
	`deposit_tx_hash` text,
	`create_escrow_tx_hash` text,
	`release_tx_hash` text,
	`refund_tx_hash` text,
	`metadata_json` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_onchain_escrow_id_idx` ON `transactions` (`onchain_escrow_id`);--> statement-breakpoint
CREATE INDEX `transactions_sender_idx` ON `transactions` (`sender_id`);--> statement-breakpoint
CREATE INDEX `transactions_institution_idx` ON `transactions` (`institution_id`);--> statement-breakpoint
CREATE INDEX `transactions_status_idx` ON `transactions` (`status`);--> statement-breakpoint
CREATE INDEX `transactions_created_at_idx` ON `transactions` (`created_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`country` text,
	`stellar_address` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE TABLE `waitlist` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`country` text NOT NULL,
	`locale` text,
	`source` text DEFAULT 'landing',
	`ip` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_email_idx` ON `waitlist` (`email`);--> statement-breakpoint
CREATE INDEX `waitlist_role_idx` ON `waitlist` (`role`);--> statement-breakpoint
CREATE INDEX `waitlist_created_at_idx` ON `waitlist` (`created_at`);