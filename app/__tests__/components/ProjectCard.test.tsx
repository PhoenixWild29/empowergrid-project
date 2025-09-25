import { render, screen } from '../utils/testUtils'
import ProjectCard from '../../components/ProjectCard'
import { createMockProject } from '../utils/testUtils'

describe('ProjectCard', () => {
  const mockProject = createMockProject()

  it('renders project information correctly', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('Test Solar Project')).toBeInTheDocument()
    expect(screen.getByText('A test renewable energy project')).toBeInTheDocument()
    expect(screen.getByText('1.00')).toBeInTheDocument() // SOL funded
    expect(screen.getByText('1000')).toBeInTheDocument() // kWh generated
    expect(screen.getByText('CO₂ Saved: 400 kg')).toBeInTheDocument()
  })

  it('displays funding progress', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText(/Funding Progress/)).toBeInTheDocument()
    // Progress calculation: (1 SOL funded / 3 milestones * 1 SOL target) * 100 = ~16.67%
    expect(screen.getByText(/16\.7%/)).toBeInTheDocument()
  })

  it('shows active status', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders view details link', () => {
    render(<ProjectCard project={mockProject} />)

    const link = screen.getByRole('link', { name: /view details/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/projects/1')
  })

  it('handles projects with no funding', () => {
    const unfundedProject = createMockProject({ fundedAmount: 0 })
    render(<ProjectCard project={unfundedProject} />)

    expect(screen.getByText('0.00')).toBeInTheDocument()
    expect(screen.getByText('0.0%')).toBeInTheDocument()
  })

  it('handles projects with zero milestones', () => {
    const noMilestonesProject = createMockProject({ numMilestones: 0 })
    render(<ProjectCard project={noMilestonesProject} />)

    expect(screen.getByText('0.0%')).toBeInTheDocument()
  })

  it('displays large numbers correctly', () => {
    const largeProject = createMockProject({
      fundedAmount: 10000000000, // 10 SOL
      kwhTotal: 1000000, // 1M kWh
      co2Total: 400000, // 400k kg
    })
    render(<ProjectCard project={largeProject} />)

    expect(screen.getByText('10.00')).toBeInTheDocument()
    expect(screen.getByText('1000000')).toBeInTheDocument()
    expect(screen.getByText('CO₂ Saved: 400000 kg')).toBeInTheDocument()
  })
})