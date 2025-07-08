import React, { useState } from "react";
import {
	Container,
	Row,
	Col,
	Card,
	Form,
	Button,
	Alert,
	Tab,
	Tabs,
	Spinner,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { User, Lock, Settings, Bell } from "lucide-react";

const Profile = () => {
	const {
		user,
		updateProfile,
		changePassword,
		profileLoading,
		changePasswordLoading,
	} = useAuth();
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	const [profileData, setProfileData] = useState({
		firstName: user?.firstName || "",
		lastName: user?.lastName || "",
		email: user?.email || "",
	});

	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const [preferences, setPreferences] = useState({
		emailNotifications: true,
		studyReminders: true,
		weeklyReports: false,
		darkMode: false,
	});

	const handleProfileUpdate = async (e) => {
		e.preventDefault();
		setMessage("");
		setError("");

		const result = await updateProfile(profileData);

		if (result.success) {
			setMessage("Profile updated successfully!");
		} else {
			setError(result.message);
		}
	};

	const handlePasswordChange = async (e) => {
		e.preventDefault();
		setMessage("");
		setError("");

		if (passwordData.newPassword !== passwordData.confirmPassword) {
			setError("New passwords do not match");
			return;
		}

		const result = await changePassword(
			passwordData.currentPassword,
			passwordData.newPassword,
			passwordData.confirmPassword
		);

		if (result.success) {
			setMessage("Password changed successfully!");
			setPasswordData({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
		} else {
			setError(result.message);
		}
	};

	const handlePreferencesUpdate = async (e) => {
		e.preventDefault();
		setMessage("Preferences updated successfully!");
	};

	return (
		<Container className="py-4">
			<Row className="justify-content-center">
				<Col lg={8}>
					<Card className="border-0 shadow-sm">
						<Card.Header className="bg-white border-0 py-3">
							<h3 className="fw-bold mb-0">
								<div className="d-flex align-items-center">
									<User size={24} className="me-2" />
									<span>Profile Settings</span>
								</div>
							</h3>
						</Card.Header>
						<Card.Body className="p-0">
							<Tabs defaultActiveKey="profile" className="border-0">
								<Tab
									eventKey="profile"
									title={
										<div className="d-flex align-items-center">
											<User size={16} className="me-2" />
											<span>Password</span>
										</div>
									}
								>
									<div className="p-4">
										{(message || error) && (
											<Alert
												variant={message ? "success" : "danger"}
												className="mb-4"
											>
												{message || error}
											</Alert>
										)}

										<Form onSubmit={handleProfileUpdate}>
											<Row>
												<Col md={6}>
													<Form.Group className="mb-3">
														<Form.Label className="fw-semibold">
															First Name
														</Form.Label>
														<Form.Control
															type="text"
															value={profileData.firstName}
															onChange={(e) =>
																setProfileData({
																	...profileData,
																	firstName: e.target.value,
																})
															}
															placeholder="Enter your first name"
															required
														/>
													</Form.Group>
												</Col>
												<Col md={6}>
													<Form.Group className="mb-3">
														<Form.Label className="fw-semibold">
															Last Name
														</Form.Label>
														<Form.Control
															type="text"
															value={profileData.lastName}
															onChange={(e) =>
																setProfileData({
																	...profileData,
																	lastName: e.target.value,
																})
															}
															placeholder="Enter your last name"
															required
														/>
													</Form.Group>
												</Col>
											</Row>

											<Form.Group className="mb-4">
												<Form.Label className="fw-semibold">
													Email Address
												</Form.Label>
												<Form.Control
													type="email"
													value={profileData.email}
													onChange={(e) =>
														setProfileData({
															...profileData,
															email: e.target.value,
														})
													}
													placeholder="Enter your email"
													required
												/>
											</Form.Group>

											<Button
												type="submit"
												variant="primary"
												disabled={profileLoading}
												className="px-4"
											>
												{profileLoading ? (
													<Spinner
														size="sm"
														animation="border"
														className="me-2"
													/>
												) : null}
												{profileLoading ? "Updating..." : "Update Profile"}
											</Button>
										</Form>
									</div>
								</Tab>

								<Tab
									eventKey="password"
									title={
										<div className="d-flex align-items-center">
											<Lock size={16} className="me-2" />
											<span>Password</span>
										</div>
									}
								>
									<div className="p-4">
										{(message || error) && (
											<Alert
												variant={message ? "success" : "danger"}
												className="mb-4"
											>
												{message || error}
											</Alert>
										)}

										<Form onSubmit={handlePasswordChange}>
											<Form.Group className="mb-3">
												<Form.Label className="fw-semibold">
													Current Password
												</Form.Label>
												<Form.Control
													type="password"
													value={passwordData.currentPassword}
													onChange={(e) =>
														setPasswordData({
															...passwordData,
															currentPassword: e.target.value,
														})
													}
													placeholder="Enter your current password"
													required
												/>
											</Form.Group>

											<Form.Group className="mb-3">
												<Form.Label className="fw-semibold">
													New Password
												</Form.Label>
												<Form.Control
													type="password"
													value={passwordData.newPassword}
													onChange={(e) =>
														setPasswordData({
															...passwordData,
															newPassword: e.target.value,
														})
													}
													placeholder="Enter your new password"
													required
												/>
												<Form.Text className="text-muted">
													Password must be at least 8 characters with uppercase,
													lowercase, number, and special character.
												</Form.Text>
											</Form.Group>

											<Form.Group className="mb-4">
												<Form.Label className="fw-semibold">
													Confirm New Password
												</Form.Label>
												<Form.Control
													type="password"
													value={passwordData.confirmPassword}
													onChange={(e) =>
														setPasswordData({
															...passwordData,
															confirmPassword: e.target.value,
														})
													}
													placeholder="Confirm your new password"
													required
												/>
											</Form.Group>

											<Button
												type="submit"
												variant="primary"
												disabled={changePasswordLoading}
												className="px-4"
											>
												{changePasswordLoading ? (
													<Spinner
														size="sm"
														animation="border"
														className="me-2"
													/>
												) : null}
												{changePasswordLoading
													? "Changing..."
													: "Change Password"}
											</Button>
										</Form>
									</div>
								</Tab>

								{/* <Tab eventKey="preferences" title={
                  <span>
                    <Settings size={16} className="me-2" />
                    Preferences
                  </span>
                }>
                  <div className="p-4">
                    {message && (
                      <Alert variant="success" className="mb-4">
                        {message}
                      </Alert>
                    )}

                    <Form onSubmit={handlePreferencesUpdate}>
                      <h5 className="fw-bold mb-3">
                        <Bell size={20} className="me-2" />
                        Notifications
                      </h5>

                      <Form.Check
                        type="switch"
                        id="email-notifications"
                        label="Email notifications"
                        checked={preferences.emailNotifications}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          emailNotifications: e.target.checked
                        })}
                        className="mb-3"
                      />

                      <Form.Check
                        type="switch"
                        id="study-reminders"
                        label="Study reminders"
                        checked={preferences.studyReminders}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          studyReminders: e.target.checked
                        })}
                        className="mb-3"
                      />

                      <Form.Check
                        type="switch"
                        id="weekly-reports"
                        label="Weekly progress reports"
                        checked={preferences.weeklyReports}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          weeklyReports: e.target.checked
                        })}
                        className="mb-4"
                      />

                      <h5 className="fw-bold mb-3">
                        <Settings size={20} className="me-2" />
                        Appearance
                      </h5>

                      <Form.Check
                        type="switch"
                        id="dark-mode"
                        label="Dark mode"
                        checked={preferences.darkMode}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          darkMode: e.target.checked
                        })}
                        className="mb-4"
                      />

                      <Button 
                        type="submit" 
                        variant="primary" 
                        className="px-4"
                      >
                        Save Preferences
                      </Button>
                    </Form>
                  </div>
                </Tab> */}
							</Tabs>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default Profile;
