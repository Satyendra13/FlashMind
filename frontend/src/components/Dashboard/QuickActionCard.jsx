import { Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

const QuickActionCard = ({
	title,
	description,
	icon: Icon,
	color,
	to,
	action,
}) => (
	<Card className="h-100 border-0 shadow-sm hover-lift">
		<Card.Body className="text-center p-4">
			<div
				className={`rounded-circle p-3 mx-auto mb-3 bg-${color} bg-opacity-10 d-inline-flex`}
			>
				<Icon className={`text-${color}`} size={32} />
			</div>
			<h5 className="fw-bold mb-2">{title}</h5>
			<p className="text-muted mb-3">{description}</p>
			{to ? (
				<Button as={Link} to={to} variant={color} size="sm">
					Get Started
				</Button>
			) : (
				<Button variant={color} size="sm" onClick={action}>
					Get Started
				</Button>
			)}
		</Card.Body>
	</Card>
);

export default QuickActionCard;
