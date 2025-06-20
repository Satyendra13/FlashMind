import { TrendingUp } from "lucide-react";
import { Card } from "react-bootstrap";

const StatCard = ({ title, value, icon: Icon, color, trend, description }) => (
	<Card className="h-100 border-0 shadow-sm hover-lift">
		<Card.Body className="d-flex align-items-center">
			<div className={`rounded-circle p-3 me-3 bg-${color} bg-opacity-10`}>
				<Icon className={`text-${color}`} size={24} />
			</div>
			<div className="flex-grow-1">
				<h6 className="text-muted mb-2 fw-normal">{title}</h6>
				<h3 className="mb-2 fw-bold">{value}</h3>
				{trend !== undefined && (
					<small
						className={`text-${
							trend > 0 ? "success" : trend < 0 ? "danger" : "muted"
						}`}
					>
						<div className="d-flex align-items-center">
							<TrendingUp size={12} className="me-1" />
							<span>{trend > 0 ? "+" : ""}</span>
							<span>{trend}%</span>
						</div>
					</small>
				)}
				{description && (
					<small className="text-muted d-block">{description}</small>
				)}
			</div>
		</Card.Body>
	</Card>
);

export default StatCard;
